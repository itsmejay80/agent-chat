import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Agent server URL for cache invalidation
const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || "http://localhost:3001";
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

// Helper to get an untyped supabase client for flexible queries
async function getSupabase() {
  return (await createClient()) as unknown as SupabaseClient;
}

// Helper to verify chatbot belongs to user's tenant
async function verifyChatbotAccess(
  supabase: SupabaseClient,
  chatbotId: string,
  tenantId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("chatbots")
    .select("id")
    .eq("id", chatbotId)
    .eq("tenant_id", tenantId)
    .single();
  return !!data;
}

// Helper to invalidate agent server cache
async function invalidateAgentCache(chatbotId: string): Promise<void> {
  try {
    if (!INTERNAL_API_TOKEN) {
      console.warn("INTERNAL_API_TOKEN not configured, skipping cache invalidation");
      return;
    }
    await fetch(`${AGENT_SERVER_URL}/api/internal/reload/${chatbotId}`, {
      method: "POST",
      headers: {
        "x-internal-token": INTERNAL_API_TOKEN,
      },
    });
  } catch (error) {
    console.error("Failed to invalidate agent cache:", error);
    // Don't throw - cache invalidation failure shouldn't break the request
  }
}

// GET /api/chatbots/[id]/knowledge - List all knowledge sources for a chatbot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatbotId } = await params;
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    // Verify chatbot belongs to tenant
    const hasAccess = await verifyChatbotAccess(
      supabase,
      chatbotId,
      userData.tenant_id
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404 }
      );
    }

    // Get knowledge sources for this chatbot
    const { data: sources, error } = await supabase
      .from("knowledge_sources")
      .select("id, name, type, text_content, status, created_at, updated_at")
      .eq("chatbot_id", chatbotId)
      .eq("type", "text") // Only text sources for now
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching knowledge sources:", error);
      return NextResponse.json(
        { error: "Failed to fetch knowledge sources" },
        { status: 500 }
      );
    }

    // Transform to camelCase for frontend
    const transformedSources = (sources || []).map((source) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      textContent: source.text_content,
      status: source.status,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    }));

    return NextResponse.json(transformedSources);
  } catch (error) {
    console.error("Error in GET /api/chatbots/[id]/knowledge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chatbots/[id]/knowledge - Create a new knowledge source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chatbotId } = await params;
    const supabase = await getSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: "No tenant found" }, { status: 404 });
    }

    // Verify chatbot belongs to tenant
    const hasAccess = await verifyChatbotAccess(
      supabase,
      chatbotId,
      userData.tenant_id
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, textContent } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!textContent || typeof textContent !== "string" || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Validate length limits
    if (name.length > 255) {
      return NextResponse.json(
        { error: "Name must be 255 characters or less" },
        { status: 400 }
      );
    }

    if (textContent.length > 100000) {
      return NextResponse.json(
        { error: "Content must be 100,000 characters or less" },
        { status: 400 }
      );
    }

    // Create knowledge source
    const { data: source, error } = await supabase
      .from("knowledge_sources")
      .insert({
        chatbot_id: chatbotId,
        type: "text",
        name: name.trim(),
        text_content: textContent.trim(),
        status: "completed", // Text sources don't need processing
      })
      .select("id, name, type, text_content, status, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating knowledge source:", error);
      return NextResponse.json(
        { error: "Failed to create knowledge source" },
        { status: 500 }
      );
    }

    // Invalidate agent server cache so it picks up new knowledge
    await invalidateAgentCache(chatbotId);

    // Transform to camelCase
    const transformedSource = {
      id: source.id,
      name: source.name,
      type: source.type,
      textContent: source.text_content,
      status: source.status,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };

    return NextResponse.json(transformedSource, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chatbots/[id]/knowledge:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
