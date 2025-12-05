// ===== app/api/auth/check/route.ts =====
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    // Optionally verify token with backend
    // For now, just check if it exists
    return NextResponse.json({
      authenticated: true,
    });
  } catch (error: any) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
