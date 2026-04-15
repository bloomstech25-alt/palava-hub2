import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  followingIds: string[];
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
  updateUser: (updates: Partial<User>) => Promise<void>;
  followUser: (targetId: string) => Promise<void>;
  unfollowUser: (targetId: string) => Promise<void>;
}

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  school: School;
  bio?: string;
  avatarUri?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) {
            setUser(snap.data() as User);
          } else {
            // Auth user exists but no Firestore profile — create a minimal one
            // so the user is never stuck with a "profile not found" error
            const fallback: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "User",
              username: (firebaseUser.email?.split("@")[0] ?? "user").toLowerCase().replace(/[^a-z0-9]/g, ""),
              email: firebaseUser.email ?? "",
              school: { id: "", name: "Unknown School", type: "university", location: "" },
              bio: "",
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName ?? "User")}&background=BF0A30&color=fff&size=200`,
              followers: 0,
              following: 0,
              followingIds: [],
              posts: 0,
              joinedAt: new Date().toISOString().split("T")[0],
            };
            try {
              await setDoc(doc(db, "users", firebaseUser.uid), fallback);
            } catch {
              // best effort — still let the user in
            }
            setUser(fallback);
          }
        } catch {
          // Network/permission error — still set null so app doesn't hang
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Set loading so the tab layout doesn't redirect during the transition
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged fires after this and handles setting user + isLoading(false)
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const code = err.code ?? "";
      const msg =
        code === "auth/invalid-credential" || code === "auth/wrong-password"
          ? "Invalid email or password."
          : code === "auth/user-not-found"
          ? "No account with that email."
          : code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : "Login failed. Please check your connection and try again.";
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      let avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=BF0A30&color=fff&size=200`;
      if (data.avatarUri) {
        try {
          const response = await fetch(data.avatarUri);
          const blob = await response.blob();
          const storageRef = ref(storage, `avatars/${uid}`);
          await uploadBytes(storageRef, blob);
          avatarUrl = await getDownloadURL(storageRef);
        } catch {
          // keep generated avatar on upload failure
        }
      }

      const newUser: User = {
        id: uid,
        name: data.name,
        username: data.username,
        email: data.email,
        school: data.school,
        bio: data.bio?.trim() ?? "",
        avatar: avatarUrl,
        followers: 0,
        following: 0,
        followingIds: [],
        posts: 0,
        joinedAt: new Date().toISOString().split("T")[0],
      };
      await setDoc(doc(db, "users", uid), newUser);
      setUser(newUser);
      return { success: true };
    } catch (err: any) {
      const msg = err.code === "auth/email-already-in-use"
        ? "An account with that email already exists."
        : err.code === "auth/weak-password"
        ? "Password must be at least 6 characters."
        : err.message ?? "Registration failed.";
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    try {
      await updateDoc(doc(db, "users", user.id), updates as Record<string, unknown>);
    } catch {
    }
  }, [user]);

  const followUser = useCallback(async (targetId: string) => {
    if (!user || targetId === user.id) return;
    if ((user.followingIds ?? []).includes(targetId)) return;
    const updatedIds = [...(user.followingIds ?? []), targetId];
    setUser({ ...user, followingIds: updatedIds, following: user.following + 1 });
    try {
      await updateDoc(doc(db, "users", user.id), {
        followingIds: arrayUnion(targetId),
        following: increment(1),
      });
      await updateDoc(doc(db, "users", targetId), {
        followers: increment(1),
      });
    } catch {
      setUser({ ...user });
    }
  }, [user]);

  const unfollowUser = useCallback(async (targetId: string) => {
    if (!user) return;
    if (!(user.followingIds ?? []).includes(targetId)) return;
    const updatedIds = (user.followingIds ?? []).filter((id) => id !== targetId);
    setUser({ ...user, followingIds: updatedIds, following: Math.max(0, user.following - 1) });
    try {
      await updateDoc(doc(db, "users", user.id), {
        followingIds: arrayRemove(targetId),
        following: increment(-1),
      });
      await updateDoc(doc(db, "users", targetId), {
        followers: increment(-1),
      });
    } catch {
      setUser({ ...user });
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        followUser,
        unfollowUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
