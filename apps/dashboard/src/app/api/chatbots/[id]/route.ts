import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to get an untyped supabase client for flexible queries
async function getSupabase() {
  return (await createClient()) as unknown as SupabaseClient;
}

// GET /api/chatbots/[id] - Get a single chatbot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { data: chatbot, error } = await supabase
      .from("chatbots")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", userData.tenant_id)
      .single();

    if (error) {
      console.error("Error fetching chatbot:", error);
      return NextResponse.json(
        { error: "Chatbot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("Error in GET /api/chatbots/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/chatbots/[id] - Update a chatbot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.system_prompt !== undefined) updateData.system_prompt = body.system_prompt;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.max_tokens !== undefined) updateData.max_tokens = body.max_tokens;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.settings !== undefined) updateData.settings = body.settings;

    const { data: chatbot, error } = await supabase
      .from("chatbots")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", userData.tenant_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating chatbot:", error);
      return NextResponse.json(
        { error: "Failed to update chatbot" },
        { status: 500 }
      );
    }

    return NextResponse.json(chatbot);
  } catch (error) {
    console.error("Error in PATCH /api/chatbots/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/chatbots/[id] - Delete a chatbot
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const { error } = await supabase
      .from("chatbots")
      .delete()
      .eq("id", id)
      .eq("tenant_id", userData.tenant_id);

    if (error) {
      console.error("Error deleting chatbot:", error);
      return NextResponse.json(
        { error: "Failed to delete chatbot" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/chatbots/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
