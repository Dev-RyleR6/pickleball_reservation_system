export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  avatar: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
