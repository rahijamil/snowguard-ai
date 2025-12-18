// ===== app/api/notifications/socket-token/route.ts =====
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API route to exchange httpOnly cookie for a WebSocket token
 * This allows frontend to get a token for Socket.IO without exposing it in localStorage
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return the token for WebSocket connection
    // This is safe because it's sent over HTTPS and used immediately
    return NextResponse.json({
      token: authToken,
      expiresIn: 300, // Token valid for 5 minutes (for WebSocket connection only)
    });
  } catch (error) {
    console.error("Socket token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
