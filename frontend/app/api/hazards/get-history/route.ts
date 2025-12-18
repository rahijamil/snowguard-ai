import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, radius = 5, days = 7 } = body;

    // Validate input
    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const authToken = request.cookies.get("auth-token")?.value;

    console.log("📊 Fetching history:", {
      lat,
      lon,
      radius,
      days,
      hasToken: !!authToken,
    });

    // Forward request to backend
    const url = `${API_URL}/api/hazards/history?lat=${lat}&lon=${lon}&radius=${radius}&days=${days}`;

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
      count: Array.isArray(data) ? data.length : 0,
    });

    return NextResponse.json({
      success: true,
      history: data,
    });
  } catch (error: any) {
    console.error("❌ Get history API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
