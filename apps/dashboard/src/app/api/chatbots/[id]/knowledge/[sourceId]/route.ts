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

// GET /api/chatbots/[id]/knowledge/[sourceId] - Get a single knowledge source
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id: chatbotId, sourceId } = await params;
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

    // Get the knowledge source
    const { data: source, error } = await supabase
      .from("knowledge_sources")
      .select("id, name, type, text_content, status, created_at, updated_at")
      .eq("id", sourceId)
      .eq("chatbot_id", chatbotId)
      .single();

    if (error || !source) {
      return NextResponse.json(
        { error: "Knowledge source not found" },
        { status: 404 }
      );
    }

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

    return NextResponse.json(transformedSource);
  } catch (error) {
    console.error("Error in GET /api/chatbots/[id]/knowledge/[sourceId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/chatbots/[id]/knowledge/[sourceId] - Update a knowledge source
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id: chatbotId, sourceId } = await params;
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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
      if (name.length > 255) {
        return NextResponse.json(
          { error: "Name must be 255 characters or less" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (textContent !== undefined) {
      if (typeof textContent !== "string" || textContent.trim().length === 0) {
        return NextResponse.json(
          { error: "Content cannot be empty" },
          { status: 400 }
        );
      }
      if (textContent.length > 100000) {
        return NextResponse.json(
          { error: "Content must be 100,000 characters or less" },
          { status: 400 }
        );
      }
      updateData.text_content = textContent.trim();
    }

    // Update the knowledge source
    const { data: source, error } = await supabase
      .from("knowledge_sources")
      .update(updateData)
      .eq("id", sourceId)
      .eq("chatbot_id", chatbotId)
      .select("id, name, type, text_content, status, created_at, updated_at")
      .single();

    if (error || !source) {
      console.error("Error updating knowledge source:", error);
      return NextResponse.json(
        { error: "Failed to update knowledge source" },
        { status: 500 }
      );
    }

    // Invalidate agent server cache
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

    return NextResponse.json(transformedSource);
  } catch (error) {
    console.error("Error in PATCH /api/chatbots/[id]/knowledge/[sourceId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/chatbots/[id]/knowledge/[sourceId] - Delete a knowledge source
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    const { id: chatbotId, sourceId } = await params;
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

    // Delete the knowledge source
    const { error } = await supabase
      .from("knowledge_sources")
      .delete()
      .eq("id", sourceId)
      .eq("chatbot_id", chatbotId);

    if (error) {
      console.error("Error deleting knowledge source:", error);
      return NextResponse.json(
        { error: "Failed to delete knowledge source" },
        { status: 500 }
      );
    }

    // Invalidate agent server cache
    await invalidateAgentCache(chatbotId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/chatbots/[id]/knowledge/[sourceId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
