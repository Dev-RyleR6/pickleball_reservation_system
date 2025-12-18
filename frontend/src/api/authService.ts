import api from "./api";
import type { LoginResponse } from "../types/user";

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", { email, password });
  const authData = {
    token: res.data.token,
    userData: res.data.user,
  };
  localStorage.setItem("user", JSON.stringify(authData));
  localStorage.setItem("token", res.data.token); // Store token separately for the axios interceptor
  return authData;
};

export const register = async (name: string, email: string, password: string) => {
  return await api.post("/auth/register", { name, email, password });
};

export const logout = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
};