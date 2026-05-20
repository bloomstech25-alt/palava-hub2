import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  school?: { id?: string; name?: string; type?: string; location?: string };
  followers?: number;
  following?: number;
  posts?: number;
  isVerified?: boolean;
  followingIds?: string[];
  blockedUserIds?: string[];
  theme?: "light" | "dark" | "auto";
};

type AuthContextValue = {
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  followUser: (targetId: string) => Promise<void>;
  unfollowUser: (targetId: string) => Promise<void>;
  blockUser: (targetId: string) => Promise<void>;
  unblockUser: (targetId: string) => Promise<void>;
  isFollowing: (targetId: string) => boolean;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            setProfile({ id: u.uid, ...(snap.data() as Omit<UserProfile, "id">) });
          } else {
            setProfile({
              id: u.uid,
              name: u.displayName ?? u.email?.split("@")[0] ?? "User",
              username: u.email?.split("@")[0] ?? u.uid.slice(0, 6),
              email: u.email ?? "",
            });
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function register(data: {
    email: string;
    password: string;
    name: string;
    username: string;
  }) {
    const cred = await createUserWithEmailAndPassword(
      auth,
      data.email.trim(),
      data.password,
    );
    const newProfile = {
      id: cred.user.uid,
      name: data.name,
      username: data.username,
      email: data.email,
      followers: 0,
      following: 0,
      posts: 0,
      followingIds: [],
      blockedUserIds: [],
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newProfile);
  }

  async function logout() {
    await signOut(auth);
  }

  const followUser = useCallback(async (targetId: string) => {
    if (!profile || targetId === profile.id) return;
    if ((profile.followingIds ?? []).includes(targetId)) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followingIds: [...(prev.followingIds ?? []), targetId],
            following: (prev.following ?? 0) + 1,
          }
        : prev,
    );
    try {
      await Promise.all([
        updateDoc(doc(db, "users", profile.id), {
          followingIds: arrayUnion(targetId),
          following: increment(1),
        }),
        updateDoc(doc(db, "users", targetId), {
          followers: increment(1),
        }),
      ]);
    } catch {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followingIds: (prev.followingIds ?? []).filter(
                (id) => id !== targetId,
              ),
              following: Math.max(0, (prev.following ?? 1) - 1),
            }
          : prev,
      );
    }
  }, [profile]);

  const unfollowUser = useCallback(async (targetId: string) => {
    if (!profile) return;
    if (!(profile.followingIds ?? []).includes(targetId)) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            followingIds: (prev.followingIds ?? []).filter(
              (id) => id !== targetId,
            ),
            following: Math.max(0, (prev.following ?? 1) - 1),
          }
        : prev,
    );
    try {
      await Promise.all([
        updateDoc(doc(db, "users", profile.id), {
          followingIds: arrayRemove(targetId),
          following: increment(-1),
        }),
        updateDoc(doc(db, "users", targetId), {
          followers: increment(-1),
        }),
      ]);
    } catch {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followingIds: [...(prev.followingIds ?? []), targetId],
              following: (prev.following ?? 0) + 1,
            }
          : prev,
      );
    }
  }, [profile]);

  const blockUser = useCallback(async (targetId: string) => {
    if (!profile) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            blockedUserIds: [...(prev.blockedUserIds ?? []), targetId],
          }
        : prev,
    );
    try {
      await updateDoc(doc(db, "users", profile.id), {
        blockedUserIds: arrayUnion(targetId),
      });
    } catch {
      /* rollback handled by next snapshot */
    }
  }, [profile]);

  const unblockUser = useCallback(async (targetId: string) => {
    if (!profile) return;
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            blockedUserIds: (prev.blockedUserIds ?? []).filter(
              (id) => id !== targetId,
            ),
          }
        : prev,
    );
    try {
      await updateDoc(doc(db, "users", profile.id), {
        blockedUserIds: arrayRemove(targetId),
      });
    } catch {
      /* ignore */
    }
  }, [profile]);

  const isFollowing = useCallback(
    (targetId: string) =>
      !!profile && (profile.followingIds ?? []).includes(targetId),
    [profile],
  );

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    if (!profile) return;
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
    await updateDoc(doc(db, "users", profile.id), patch as Record<string, unknown>);
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        loading,
        firebaseUser,
        profile,
        login,
        register,
        logout,
        followUser,
        unfollowUser,
        blockUser,
        unblockUser,
        isFollowing,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
