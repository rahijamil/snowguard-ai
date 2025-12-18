import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authToken = request.cookies.get("auth-token")?.value;

    if (!body.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Configure headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Forward request to backend
    const response = await fetch(
      `${API_URL}/api/users/${body.userId}/preferences`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(body.preferences),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Update preferences failed:", data);
      return NextResponse.json(
        { error: data.error || "preferences failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
