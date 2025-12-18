import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, days } = body;

    const authToken = request.cookies.get("auth-token")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("📊 Fetching history:", {
      userId,
      days: days || 30,
      hasToken: !!authToken,
    });

    // Forward request to backend
    const url = `${API_URL}/api/route/history?userId=${userId}&days=${days}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend error:", data);
      return NextResponse.json(
        { error: data.error || "Failed to fetch history" },
        { status: response.status }
      );
    }

    console.log("✅ History fetched successfully:", {
      count: Array.isArray(data.routes) ? data.routes.length : 0,
    });

    return NextResponse.json(data.routes);
  } catch (error: any) {
    console.error("❌ Get history API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
