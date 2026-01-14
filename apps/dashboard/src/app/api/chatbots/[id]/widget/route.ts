import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper to get an untyped supabase client for flexible queries
async function getSupabase() {
  return (await createClient()) as unknown as SupabaseClient;
}

// GET /api/chatbots/[id]/widget - Get widget configuration
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

    const { data: widgetConfig, error } = await supabase
      .from("widget_configs")
      .select("*")
      .eq("chatbot_id", id)
      .single();

    if (error) {
      // If no config exists, return defaults
      if (error.code === "PGRST116") {
        return NextResponse.json({
          position: "bottom-right",
          primary_color: "#6366f1",
          background_color: "#ffffff",
          text_color: "#1f2937",
          border_radius: 12,
          title: "Chat with us",
          subtitle: "We typically reply within minutes",
          welcome_message: "Hi! How can I help you today?",
          placeholder: "Type your message...",
          auto_open: false,
          auto_open_delay: 3,
          show_branding: true,
        });
      }
      console.error("Error fetching widget config:", error);
      return NextResponse.json(
        { error: "Failed to fetch widget configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json(widgetConfig);
  } catch (error) {
    console.error("Error in GET /api/chatbots/[id]/widget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/chatbots/[id]/widget - Update widget configuration
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

    const body = await request.json();

    // Check if widget config exists
    const { data: existingConfig } = await supabase
      .from("widget_configs")
      .select("id")
      .eq("chatbot_id", id)
      .single();

    let result;

    if (existingConfig) {
      // Update existing config
      const updateData: Record<string, unknown> = {};
      if (body.position !== undefined) updateData.position = body.position;
      if (body.primary_color !== undefined) updateData.primary_color = body.primary_color;
      if (body.background_color !== undefined) updateData.background_color = body.background_color;
      if (body.text_color !== undefined) updateData.text_color = body.text_color;
      if (body.border_radius !== undefined) updateData.border_radius = body.border_radius;
      if (body.title !== undefined) updateData.title = body.title;
      if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
      if (body.welcome_message !== undefined) updateData.welcome_message = body.welcome_message;
      if (body.placeholder !== undefined) updateData.placeholder = body.placeholder;
      if (body.auto_open !== undefined) updateData.auto_open = body.auto_open;
      if (body.auto_open_delay !== undefined) updateData.auto_open_delay = body.auto_open_delay;
      if (body.show_branding !== undefined) updateData.show_branding = body.show_branding;
      if (body.allowed_domains !== undefined) updateData.allowed_domains = body.allowed_domains;

      updateData.updated_at = new Date().toISOString();

      result = await supabase
        .from("widget_configs")
        .update(updateData)
        .eq("chatbot_id", id)
        .select()
        .single();
    } else {
      // Create new config
      result = await supabase
        .from("widget_configs")
        .insert({
          chatbot_id: id,
          position: body.position || "bottom-right",
          primary_color: body.primary_color || "#6366f1",
          background_color: body.background_color || "#ffffff",
          text_color: body.text_color || "#1f2937",
          border_radius: body.border_radius ?? 12,
          title: body.title || "Chat with us",
          subtitle: body.subtitle,
          welcome_message: body.welcome_message || "Hi! How can I help you today?",
          placeholder: body.placeholder || "Type your message...",
          auto_open: body.auto_open ?? false,
          auto_open_delay: body.auto_open_delay ?? 3,
          show_branding: body.show_branding ?? true,
          allowed_domains: body.allowed_domains || [],
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error updating widget config:", result.error);
      return NextResponse.json(
        { error: "Failed to update widget configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error in PATCH /api/chatbots/[id]/widget:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
