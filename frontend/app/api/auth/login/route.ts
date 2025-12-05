import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Login request for:", body.email);

    // Forward request to backend
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Login failed:", data);
      return NextResponse.json(
        { error: data.error || "Login failed" },
        { status: response.status }
      );
    }

    console.log("Login successful, setting cookie");

    const { token, userId, email, name } = data;

    // Create response with user data
    const res = NextResponse.json({
      success: true,
      userId,
      email,
      name,
    });

    // Set httpOnly cookie with token
    res.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
