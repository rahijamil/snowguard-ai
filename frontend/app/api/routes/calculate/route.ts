// ===== app/api/routes/calculate/route.ts =====
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fromLat = searchParams.get("fromLat");
    const fromLon = searchParams.get("fromLon");
    const toLat = searchParams.get("toLat");
    const toLon = searchParams.get("toLon");
    const pref = searchParams.get("pref") || "safe";

    // Validate required parameters
    if (!fromLat || !fromLon || !toLat || !toLon) {
      return NextResponse.json(
        { error: "Missing required route parameters" },
        { status: 400 }
      );
    }

    const backendUrl = `${API_URL}/api/route`;
    const authToken = request.cookies.get("auth-token")?.value;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    };

    const response = await axios.get(backendUrl, {
      headers,
      params: { fromLat, fromLon, toLat, toLon, pref },
      timeout: 10000,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Route calculation error:", error);

    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.error || "Backend error" },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: "Failed to calculate route" },
      { status: 500 }
    );
  }
}
