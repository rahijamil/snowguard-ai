// ===== app/api/chat/get-history/route.ts =====
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const radius = searchParams.get("radius");
    const authToken = request.cookies.get("auth-token")?.value;
    const userIdHeader = request.headers.get("X-User-Id");
    console.log("Next.js API Route: Received X-User-Id header:", userIdHeader);

    // Build the URL for the backend API
    const backendUrl = `${API_URL}/api/dashboard`;

    // Configure headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (userIdHeader) {
      headers["X-User-Id"] = userIdHeader;
    }

    // Forward request to backend using axios
    console.log("Calling backend:", backendUrl);
    console.log("Params:", { lat, lon, radius });

    const response = await axios.get(backendUrl, {
      headers,
      params: {
        lat: lat ? parseFloat(lat) : undefined,
        lon: lon ? parseFloat(lon) : undefined,
        radius: radius ? parseFloat(radius) : undefined,
      },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });

    console.log("Backend response status:", response.status);
    console.log("Backend response data:", response.data);

    // Handle non-2xx status codes
    if (response.status >= 400) {
      return NextResponse.json(
        {
          error: response.data?.error || `Backend returned ${response.status}`,
          details: response.data,
        },
        { status: response.status }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);

    // Handle axios specific errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        "Backend error response:",
        error.response.status,
        error.response.data
      );

      return NextResponse.json(
        {
          error:
            error.response.data?.error ||
            `Backend error: ${error.response.status}`,
          details: error.response.data,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);

      return NextResponse.json(
        { error: "Backend service is unavailable" },
        { status: 503 }
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request setup error:", error.message);

      return NextResponse.json(
        { error: "Failed to process request" },
        { status: 500 }
      );
    }
  }
}
