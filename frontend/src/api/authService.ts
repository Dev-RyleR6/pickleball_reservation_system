import api from "./api";
import type { User } from "../types/user";

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  return res.data;
};

export const logout = (): void => {
  localStorage.removeItem("token");
};
