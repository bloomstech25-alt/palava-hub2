import {
  createContext,
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
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
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
    const newProfile: Omit<UserProfile, "id"> & { createdAt: unknown } = {
      name: data.name,
      username: data.username,
      email: data.email,
      followers: 0,
      following: 0,
      posts: 0,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newProfile);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ loading, firebaseUser, profile, login, register, logout }}
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
