import { createContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types/user";
import api from "../api/api";

interface AuthContextProps {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get<User>("/users/me");
          setUser(res.data);
        } catch {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
    };
    fetchUser();
  }, []);

  const login = (user: User) => setUser(user);
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
