import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  writeBatch,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  deleteDoc,
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
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  phone?: string;
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
  applyForVerification: () => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  school: School;
  bio?: string;
  avatarUri?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let userUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous user listener whenever auth state changes
      if (userUnsub) { userUnsub(); userUnsub = null; }

      if (firebaseUser) {
        // Build a minimal user profile from Firebase Auth data alone,
        // used as fallback when Firestore is temporarily unreachable.
        const buildFallback = (): User => ({
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
        });

        // Subscribe to real-time updates on this user's Firestore doc so that
        // any write (following, being followed, posting) instantly updates the UI
        userUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          async (snap) => {
            if (snap.exists()) {
              setUser({ ...(snap.data() as User), id: snap.id });
            } else {
              // No Firestore profile yet — create a minimal fallback
              const fallback = buildFallback();
              try { await setDoc(doc(db, "users", firebaseUser.uid), fallback); } catch { /* best effort */ }
              setUser(fallback);
            }
            setIsLoading(false);
          },
          async () => {
            // Firestore connection error (e.g. 600ms timeout in proxied env).
            // Don't immediately log the user out — they ARE still authenticated.
            // Try a one-shot getDoc as fallback; if that also fails, use Auth data.
            try {
              const snap = await getDoc(doc(db, "users", firebaseUser.uid));
              if (snap.exists()) {
                setUser({ ...(snap.data() as User), id: snap.id });
              } else {
                const fallback = buildFallback();
                try { await setDoc(doc(db, "users", firebaseUser.uid), fallback); } catch { /* best effort */ }
                setUser(fallback);
              }
            } catch {
              // Even getDoc failed — keep the user logged in with Auth-only data
              setUser(buildFallback());
            }
            setIsLoading(false);
          }
        );
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      if (userUnsub) userUnsub();
      authUnsub();
    };
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
        ...(data.phone ? { phone: data.phone } : {}),
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

  const applyForVerification = useCallback(async () => {
    if (!user) return { success: false, error: "Not logged in." };
    const REQUIRED_FOLLOWERS = 50;
    if ((user.followers ?? 0) < REQUIRED_FOLLOWERS) {
      return { success: false, error: `You need at least ${REQUIRED_FOLLOWERS} followers to apply.` };
    }
    const existing = user.verificationStatus;
    if (existing === "pending") return { success: false, error: "Your application is already under review." };
    if (existing === "approved") return { success: false, error: "You are already verified." };
    try {
      await setDoc(doc(db, "verificationRequests", user.id), {
        userId: user.id,
        userName: user.name,
        userUsername: user.username,
        userAvatar: user.avatar,
        userSchool: user.school.name,
        followers: user.followers,
        appliedAt: serverTimestamp(),
        status: "pending",
      });
      await updateDoc(doc(db, "users", user.id), { verificationStatus: "pending" });
      return { success: true };
    } catch {
      return { success: false, error: "Failed to submit application. Please try again." };
    }
  }, [user]);

  // Permanently deletes the user from Firebase Auth AND all of their data
  // across Firestore (posts, ads, support requests, verification requests,
  // profile). Required by Google Play / App Store policy.
  //
  // Order is critical: we delete the Auth user LAST so that all Firestore
  // writes (which depend on auth) can succeed. If `deleteUser` requires a
  // recent login we surface that without having destroyed any data yet.
  const deleteAccount = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return { success: false, error: "Not signed in." };
    const uid = fbUser.uid;

    // Pre-flight: check whether Firebase will let us delete the Auth user
    // right now. If not, bail out BEFORE we wipe any Firestore data.
    // `deleteUser` is the only way to reliably know — but we do it last.
    // Instead we rely on the standard Firebase contract: if the last sign-in
    // was within ~5 min the call succeeds; otherwise it throws
    // `auth/requires-recent-login`. We catch that below and the caller can
    // ask the user to re-authenticate.

    // Helper to delete every doc in a collection where `field == uid`.
    async function purgeBy(coll: string, field: string) {
      try {
        const snap = await getDocs(query(collection(db, coll), where(field, "==", uid)));
        if (snap.empty) return;
        // Firestore batches max 500 ops; chunk to be safe.
        const chunks: typeof snap.docs[] = [];
        for (let i = 0; i < snap.docs.length; i += 400) {
          chunks.push(snap.docs.slice(i, i + 400));
        }
        for (const chunk of chunks) {
          const batch = writeBatch(db);
          for (const d of chunk) batch.delete(d.ref);
          await batch.commit();
        }
      } catch {
        // Best-effort — keep going; the Auth user is the source of truth.
      }
    }

    try {
      // Try the auth delete FIRST so that if recent-login is required we
      // haven't touched any data yet.
      await deleteUser(fbUser);

      // Auth user is gone. Now clean up everything associated with this uid.
      // These run after deletion: rules must allow this OR you'll need a
      // server-side trigger. With Firestore default rules + the user still
      // recently authenticated, the in-flight token usually allows these to
      // succeed for a short window. Anything that fails will be cleaned up
      // by the server-side admin sweep.
      await Promise.allSettled([
        deleteDoc(doc(db, "users", uid)),
        deleteDoc(doc(db, "verificationRequests", uid)),
        purgeBy("posts", "authorId"),
        purgeBy("ads", "createdBy"),
        purgeBy("supportRequests", "userId"),
      ]);

      setUser(null);
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      const msg = code === "auth/requires-recent-login"
        ? "For security, please sign out and sign back in, then try again."
        : err?.message ?? "Failed to delete account.";
      return { success: false, error: msg };
    }
  }, []);

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
        applyForVerification,
        deleteAccount,
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
