import api from "./api";
import type {LoginResponse } from "../types/user";


export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", res.data.token);
  return { token: res.data.token, user: res.data.user };
};

export const register = async (name: string, email: string, password: string) => {
  return await api.post("/auth/register", { name, email, password });
};

export const logout = () => {
  localStorage.removeItem("token");
};