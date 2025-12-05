import type { LoginRequest, RegisterRequest, AuthResponse } from "../types";

export const authApi = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const result = await response.json();

    // Return user data (token is in httpOnly cookie)
    return {
      token: "", // Not needed in client
      userId: result.userId,
      email: result.email,
      name: result.name,
    };
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const result = await response.json();

    // Return user data (token is in httpOnly cookie)
    return {
      token: "", // Not needed in client
      userId: result.userId,
      email: result.email,
      name: result.name,
    };
  },

  async logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  },
};
