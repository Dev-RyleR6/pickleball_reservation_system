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
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
        try {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.userData) {
          return parsed.userData;
        }
        // If the structure is wrong, clear it
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
        } catch {
        localStorage.removeItem("user");
          localStorage.removeItem("token");
        return null;
        }
      }
    return null;
  });

  const login = (userData: User) => {
    setUser(userData);
    };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
