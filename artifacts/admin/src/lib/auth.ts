import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

export interface AdminAuthState {
  loading: boolean;
  user: User | null;
  isAdmin: boolean;
}

let cached: AdminAuthState = { loading: true, user: null, isAdmin: false };
const listeners = new Set<(s: AdminAuthState) => void>();

function emit(next: AdminAuthState) {
  cached = next;
  listeners.forEach((l) => l(next));
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    emit({ loading: false, user: null, isAdmin: false });
    return;
  }
  try {
    const tokenResult = await user.getIdTokenResult(true);
    const isAdmin = tokenResult.claims.admin === true;
    emit({ loading: false, user, isAdmin });
  } catch {
    emit({ loading: false, user, isAdmin: false });
  }
});

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>(cached);
  useEffect(() => {
    setState(cached);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

export function getAuthSnapshot(): AdminAuthState {
  return cached;
}

export async function logoutAdmin(): Promise<void> {
  await fbSignOut(auth);
}

export function isAuthenticated(): boolean {
  return cached.user !== null && cached.isAdmin;
}
