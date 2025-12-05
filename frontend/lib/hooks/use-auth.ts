"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth-store";
import { authApi } from "../api/auth";
import type { LoginRequest, RegisterRequest } from "../types";

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    setAuth,
    logout: storeLogout,
  } = useAuthStore();

  const login = async (data: LoginRequest) => {
    try {
      const response = await authApi.login(data);
      setAuth({
        id: response.userId,
        email: response.email,
        name: response.name,
      });
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage = error.message || "Login failed";
      throw new Error(errorMessage);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data);
      setAuth({
        id: response.userId,
        email: response.email,
        name: response.name,
      });
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage = error.message || "Registration failed";
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await authApi.logout();
    storeLogout();
    router.push("/login");
  };

  const checkAuth = () => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return false;
    }
    return true;
  };

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };
}
