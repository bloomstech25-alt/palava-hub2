import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("admin_token"));

  const login = (newToken: string) => {
    localStorage.setItem("admin_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return { token, login, logout, isAuthenticated: !!token };
}
