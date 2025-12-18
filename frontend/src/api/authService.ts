import api from "./api";
import type { LoginResponse, User } from "../types/user";

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

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const res = await api.get<{ users: User[] }>("/auth/users");
    return res.data.users || [];
  } catch (err) {
    console.error("Failed to fetch users:", err);
    throw err;
  }
};

export const updateUserRole = async (userId: number, role: "admin" | "player"): Promise<User> => {
  try {
    const res = await api.put<{ user: User }>(`/auth/users/${userId}/role`, { role });
    return res.data.user;
  } catch (err) {
    console.error(`Failed to update user role for ${userId}:`, err);
    throw err;
  }
};

export const deleteUser = async (userId: number): Promise<void> => {
  try {
    await api.delete(`/auth/users/${userId}`);
  } catch (err) {
    console.error(`Failed to delete user ${userId}:`, err);
    throw err;
  }
};