import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to get an untyped supabase client for flexible queries
async function getSupabase() {
  return (await createClient()) as unknown as SupabaseClient;
}

// GET /api/chatbots - List all chatbots for the current user's tenant
export async function GET() {
  try {
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

    const { data: chatbots, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("tenant_id", userData.tenant_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chatbots:", error);
      return NextResponse.json(
        { error: "Failed to fetch chatbots" },
        { status: 500 }
      );
    }

    return NextResponse.json(chatbots);
  } catch (error) {
    console.error("Error in GET /api/chatbots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/chatbots - Create a new chatbot
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data: chatbot, error } = await supabase
      .from("chatbots")
      .insert({
        tenant_id: userData.tenant_id,
        name: body.name,
        description: body.description || null,
        system_prompt: body.system_prompt || "You are a helpful assistant.",
        model: body.model || "gemini-2.0-flash",
        temperature: body.temperature ?? 0.7,
        max_tokens: body.max_tokens ?? 2048,
        is_active: body.is_active ?? true,
        settings: body.settings || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating chatbot:", error);
      return NextResponse.json(
        { error: "Failed to create chatbot" },
        { status: 500 }
      );
    }

    // Create default widget config
    await supabase.from("widget_configs").insert({
      chatbot_id: chatbot.id,
      title: body.name,
      welcome_message: `Hi! I'm ${body.name}. How can I help you today?`,
    });

    return NextResponse.json(chatbot, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/chatbots:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
