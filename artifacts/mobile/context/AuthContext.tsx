import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface School {
  id: string;
  name: string;
  type: "university" | "high_school";
  location: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  school: School;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  posts: number;
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  school: School;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: User[] = [
  {
    id: "u1",
    name: "Alex Johnson",
    username: "alexj",
    email: "alex@example.com",
    school: { id: "s1", name: "MIT", type: "university", location: "Cambridge, MA" },
    bio: "CS student passionate about AI and startups. Building the future one commit at a time.",
    avatar: "https://i.pravatar.cc/150?img=1",
    followers: 1240,
    following: 380,
    posts: 89,
    joinedAt: "2024-09-01",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("@studentconnect/user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    const found = MOCK_USERS.find((u) => u.email === email);
    if (found) {
      await AsyncStorage.setItem("@studentconnect/user", JSON.stringify(found));
      setUser(found);
      return { success: true };
    }
    if (email && _password) {
      const newUser: User = {
        id: Date.now().toString(),
        name: email.split("@")[0],
        username: email.split("@")[0].toLowerCase(),
        email,
        school: { id: "s1", name: "MIT", type: "university", location: "Cambridge, MA" },
        bio: "",
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
        followers: 0,
        following: 0,
        posts: 0,
        joinedAt: new Date().toISOString().split("T")[0],
      };
      await AsyncStorage.setItem("@studentconnect/user", JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    }
    return { success: false, error: "Invalid credentials" };
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: data.name,
      username: data.username,
      email: data.email,
      school: data.school,
      bio: "",
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      followers: 0,
      following: 0,
      posts: 0,
      joinedAt: new Date().toISOString().split("T")[0],
    };
    await AsyncStorage.setItem("@studentconnect/user", JSON.stringify(newUser));
    setUser(newUser);
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("@studentconnect/user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    AsyncStorage.setItem("@studentconnect/user", JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
