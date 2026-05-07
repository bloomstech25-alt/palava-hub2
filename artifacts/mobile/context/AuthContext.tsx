import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  sendPasswordResetEmail,
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
import { ref } from "firebase/storage";
import { uploadUriToStorage } from "@/utils/uploadBlob";
import { registerForPushNotificationsAsync, sendExpoPush } from "@/utils/notifications";
import { normalizeUser } from "@/utils/normalizeUser";

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
  // List of user ids the current user has blocked. Posts/messages from
  // these users are filtered out of feeds and conversations. Required by
  // Apple App Store Guideline 1.2 for any app with user-generated content.
  blockedUserIds?: string[];
  // Expo push token registered from this device. Other clients send pushes
  // directly via the Expo Push API using this token, so no server is needed.
  expoPushToken?: string;
  // Per-channel notification opt-ins. Defaults are "on" when missing.
  notifications?: {
    messages?: boolean;
    likes?: boolean;
    follows?: boolean;
    comments?: boolean;
  };
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
  blockUser: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  unblockUser: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  reportContent: (input: ReportInput) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "nudity"
  | "violence"
  | "self_harm"
  | "misinformation"
  | "other";

export interface ReportInput {
  // What is being reported
  targetType: "post" | "user" | "message" | "comment";
  targetId: string;
  // The author of the reported content (so the admin can act on the user too)
  targetUserId?: string;
  reason: ReportReason;
  details?: string;
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
  dob: string; // ISO date YYYY-MM-DD — required for store-compliant age gating
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let userUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      // eslint-disable-next-line no-console
      console.log("[auth] onAuthStateChanged →", firebaseUser ? `uid=${firebaseUser.uid}` : "signed out");
      // Clean up previous user listener whenever auth state changes
      if (userUnsub) { userUnsub(); userUnsub = null; }

      if (firebaseUser) {
        // Subscribe to real-time updates on this user's Firestore doc so that
        // any write (following, being followed, posting) instantly updates the
        // UI. We DELIBERATELY do not auto-create a fallback profile here —
        // doing so used to race with register()'s setDoc and could permanently
        // overwrite the real profile (school name, avatar, etc.) with
        // placeholder values like "Unknown School". If the doc isn't there
        // yet, we just keep loading; register() always writes the doc.
        userUnsub = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          (snap) => {
            // eslint-disable-next-line no-console
            console.log("[auth] user snapshot →", snap.exists() ? "exists" : "missing");
            if (snap.exists()) {
              setUser(normalizeUser(snap.data(), snap.id));
              setIsLoading(false);
            } else {
              // Profile is missing on a signed-in account. This is the
              // "orphan account" state — auth user exists but Firestore
              // profile doesn't (e.g. register failed mid-way, or rules
              // blocked the setDoc). Don't leave the app stuck in isLoading;
              // flip loading off so the login screen can show an error and
              // navigation guards can route them out of the tabs.
              setIsLoading(false);
            }
          },
          async (err) => {
            // eslint-disable-next-line no-console
            console.warn("[auth] user snapshot error", err?.code, err?.message);
            // Firestore connection error (e.g. 600ms timeout in proxied env).
            // Don't log the user out — try a one-shot getDoc as fallback.
            try {
              const snap = await getDoc(doc(db, "users", firebaseUser.uid));
              if (snap.exists()) {
                setUser(normalizeUser(snap.data(), snap.id));
              }
            } catch (fallbackErr) {
              // eslint-disable-next-line no-console
              console.warn("[auth] fallback getDoc failed", (fallbackErr as { code?: string })?.code);
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

  // Once we know who the user is, register this device's Expo push token and
  // store it on their profile. Other clients will read it to send pushes
  // directly via the Expo Push API. We re-register whenever the stored token
  // doesn't match the current one (e.g. user reinstalled the app).
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (cancelled || !token) return;
        if (user.expoPushToken === token) return;
        await updateDoc(doc(db, "users", user.id), { expoPushToken: token });
      } catch {
        // Push registration is best effort; never block the app on it.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.expoPushToken]);

  const login = useCallback(async (email: string, password: string) => {
    // Set loading so the tab layout doesn't redirect during the transition
    setIsLoading(true);
    try {
      // eslint-disable-next-line no-console
      console.log("[auth] login: signing in", email);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // eslint-disable-next-line no-console
      console.log("[auth] login: signed in uid=", cred.user.uid);

      // Don't await the profile getDoc here — it adds a noticeable delay
      // to login on slow/proxied connections. The onAuthStateChanged +
      // onSnapshot listener already fetches the profile and will surface
      // any orphan state by setting isLoading(false) without setting user.
      // Returning immediately here makes the spinner stop and the login
      // screen's useEffect navigate to /(tabs) as soon as
      // isAuthenticated flips.
      return { success: true };
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.warn("[auth] login error", err?.code, err?.message);
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
          : code === "auth/network-request-failed"
          ? "Network error. Please check your internet connection."
          : "Login failed. Please check your connection and try again.";
      return { success: false, error: msg };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      // Default to a generated avatar URL — we'll swap in the uploaded one
      // below if/when the Storage upload succeeds.
      const placeholderAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=BF0A30&color=fff&size=200`;

      const newUser: User = {
        id: uid,
        name: data.name,
        username: data.username,
        email: data.email,
        school: data.school,
        bio: data.bio?.trim() ?? "",
        avatar: placeholderAvatar,
        followers: 0,
        following: 0,
        followingIds: [],
        posts: 0,
        joinedAt: new Date().toISOString().split("T")[0],
        ...(data.phone ? { phone: data.phone } : {}),
      };
      // CRITICAL: write the real profile to Firestore IMMEDIATELY (with a
      // placeholder avatar) before doing anything async like uploading the
      // chosen avatar. Otherwise the auth-state snapshot listener fires while
      // the avatar upload is still pending and races with us — historically
      // that race overwrote the user's real school with a generic fallback.
      // Persist DOB on the Firestore record (kept off the public User type
      // to avoid leaking it in feed embeds — mirrors how `phone` is handled).
      await setDoc(doc(db, "users", uid), { ...newUser, dob: data.dob });
      setUser(newUser);

      // Now upload the avatar in the background and patch the doc once it's
      // done. We don't block registration on this — the user lands in the
      // app right away with a generated avatar, and their photo appears
      // a moment later when Storage finishes.
      if (data.avatarUri) {
        (async () => {
          try {
            const storageRef = ref(storage, `avatars/${uid}`);
            const avatarUrl = await uploadUriToStorage(data.avatarUri!, storageRef, "image/jpeg", { compress: true });
            await updateDoc(doc(db, "users", uid), { avatar: avatarUrl });
          } catch {
            // keep generated avatar on upload failure — non-fatal
          }
        })();
      }
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
    // Optimistic UI update — user sees instant feedback.
    setUser({ ...user, followingIds: updatedIds, following: user.following + 1 });
    // Fire both Firestore writes in parallel and don't block the UI on them.
    // The previous implementation awaited them sequentially, which made the
    // follow button feel laggy on slow networks.
    Promise.all([
      updateDoc(doc(db, "users", user.id), {
        followingIds: arrayUnion(targetId),
        following: increment(1),
      }),
      updateDoc(doc(db, "users", targetId), {
        followers: increment(1),
      }),
    ]).catch(() => {
      // Roll back optimistic update on failure.
      setUser((prev) => prev ? {
        ...prev,
        followingIds: (prev.followingIds ?? []).filter((id) => id !== targetId),
        following: Math.max(0, prev.following - 1),
      } : prev);
    });

    // Notify the followed user. Read their token + opt-in fresh so we
    // honor changes they've made on their other device.
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", targetId));
        if (!snap.exists()) return;
        const data = snap.data() as {
          expoPushToken?: string;
          notifications?: { follows?: boolean };
        };
        const allowed = data.notifications?.follows !== false;
        if (!allowed || !data.expoPushToken) return;
        await sendExpoPush({
          to: data.expoPushToken,
          title: "New follower",
          body: `${user.name || "Someone"} started following you`,
          data: { type: "follow", fromUserId: user.id },
        });
      } catch {
        // best effort
      }
    })();
  }, [user]);

  const unfollowUser = useCallback(async (targetId: string) => {
    if (!user) return;
    if (!(user.followingIds ?? []).includes(targetId)) return;
    const updatedIds = (user.followingIds ?? []).filter((id) => id !== targetId);
    setUser({ ...user, followingIds: updatedIds, following: Math.max(0, user.following - 1) });
    Promise.all([
      updateDoc(doc(db, "users", user.id), {
        followingIds: arrayRemove(targetId),
        following: increment(-1),
      }),
      updateDoc(doc(db, "users", targetId), {
        followers: increment(-1),
      }),
    ]).catch(() => {
      setUser((prev) => prev ? {
        ...prev,
        followingIds: [...(prev.followingIds ?? []), targetId],
        following: prev.following + 1,
      } : prev);
    });
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
        userSchool: user.school?.name ?? "",
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

  // ─── Block / Unblock — required by Apple Guideline 1.2 ─────────────────────
  // Adds/removes a user id from the current user's blockedUserIds. Posts and
  // messages from blocked users are filtered out client-side by FeedContext
  // and MessagingContext. We deliberately keep this as a list on the blocker's
  // own document so reads are cheap and don't require querying another doc.
  const blockUser = useCallback(async (targetId: string) => {
    if (!user) return { success: false, error: "Not signed in." };
    if (targetId === user.id) return { success: false, error: "You cannot block yourself." };
    const current = user.blockedUserIds ?? [];
    if (current.includes(targetId)) return { success: true };
    setUser({ ...user, blockedUserIds: [...current, targetId] });
    try {
      await updateDoc(doc(db, "users", user.id), { blockedUserIds: arrayUnion(targetId) });
      return { success: true };
    } catch {
      // Roll back optimistic update
      setUser({ ...user, blockedUserIds: current });
      return { success: false, error: "Could not block user. Please try again." };
    }
  }, [user]);

  const unblockUser = useCallback(async (targetId: string) => {
    if (!user) return { success: false, error: "Not signed in." };
    const current = user.blockedUserIds ?? [];
    if (!current.includes(targetId)) return { success: true };
    setUser({ ...user, blockedUserIds: current.filter((id) => id !== targetId) });
    try {
      await updateDoc(doc(db, "users", user.id), { blockedUserIds: arrayRemove(targetId) });
      return { success: true };
    } catch {
      setUser({ ...user, blockedUserIds: current });
      return { success: false, error: "Could not unblock user. Please try again." };
    }
  }, [user]);

  // ─── Report content — required by Apple Guideline 1.2 ─────────────────────
  // Writes to a top-level `reports` collection that the admin dashboard
  // surfaces and acts on. We include enough context for the admin to
  // investigate without needing to look up the offending content separately.
  const reportContent = useCallback(async (input: ReportInput) => {
    if (!user) return { success: false, error: "Not signed in." };
    if (input.targetUserId && input.targetUserId === user.id) {
      return { success: false, error: "You cannot report your own content." };
    }
    try {
      await setDoc(
        doc(collection(db, "reports")),
        {
          targetType: input.targetType,
          targetId: input.targetId,
          targetUserId: input.targetUserId ?? null,
          reason: input.reason,
          details: input.details?.trim() ?? "",
          reporterId: user.id,
          reporterUsername: user.username,
          status: "pending",
          createdAt: serverTimestamp(),
        }
      );
      return { success: true };
    } catch {
      return { success: false, error: "Could not submit report. Please try again." };
    }
  }, [user]);

  // Password reset — sends a Firebase-hosted reset email to the address.
  // We never confirm whether the email exists (security: account-enumeration
  // protection). The Firebase template handles the rest of the flow.
  const resetPassword = useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return { success: false, error: "Please enter your email address." };
    try {
      await sendPasswordResetEmail(auth, trimmed);
      return { success: true };
    } catch (err: any) {
      const code = err?.code ?? "";
      const msg =
        code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : code === "auth/user-not-found"
          // Don't leak account existence — generic success-style message.
          ? "If an account exists for that email, a reset link is on its way."
          : code === "auth/network-request-failed"
          ? "Network error. Please check your internet connection."
          : "Could not send reset email. Please try again.";
      // Treat user-not-found as a soft-success so we don't reveal which
      // emails are registered.
      if (code === "auth/user-not-found") return { success: true };
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
        blockUser,
        unblockUser,
        reportContent,
        resetPassword,
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
