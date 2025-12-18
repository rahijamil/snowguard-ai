// ===== app/api/notifications/route.ts =====
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Proxy for notification API requests
 * Automatically adds auth token from httpOnly cookie
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Build query string
    const params = new URLSearchParams();
    if (unreadOnly) params.append("unreadOnly", unreadOnly);
    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);

    // Forward request to notification service
    const response = await fetch(
      `${API_URL}/api/notifications?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Notifications proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
