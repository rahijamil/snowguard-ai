// ===== app/api/hazards/get-hazards/route.ts =====
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const authToken = request.cookies.get("auth-token")?.value;

    const queryParams = new URLSearchParams(body).toString();

    // Forward request to backend
    const response = await fetch(`${API_URL}/api/hazards?${queryParams}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Get Hazard Failed" },
        { status: response.status }
      );
    }

    // Extract token from response
    const { location, hazardSummary, timestamp, warning } = data;

    // Return user data (not token)
    return NextResponse.json({
      success: true,
      location,
      hazardSummary,
      timestamp,
      warning,
    });
  } catch (error: any) {
    console.error("Hazard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
