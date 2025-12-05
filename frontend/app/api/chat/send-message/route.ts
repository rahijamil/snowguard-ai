// ===== app/api/chat/send-message/route.ts - FIXED =====
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = request.cookies.get("auth-token")?.value;

    console.log("Forwarding chat request to backend...");

    // Forward request to backend
    const response = await fetch(`${API_URL}/api/chat`, {
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      method: "POST",
      body: JSON.stringify(body.data),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend error:", data);
      return NextResponse.json(
        { error: data.error || "Send Message Failed" },
        { status: response.status }
      );
    }

    console.log("Chat response received:", {
      hasReply: !!data.reply,
      confidence: data.confidence,
      suggestionsCount: data.suggestions?.length || 0,
      warningsCount: data.warnings?.length || 0,
    });

    // Return full response with all data
    return NextResponse.json({
      success: true,
      reply: data.reply, // Don't stringify - keep as-is
      confidence: data.confidence,
      suggestions: data.suggestions || [],
      warnings: data.warnings || [],
      metadata: data.metadata || {},
      timestamp: data.timestamp || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Send Message API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
