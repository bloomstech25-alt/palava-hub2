import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const API_BASE: string = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""
).replace(/\/+$/, "");

async function callAdminApi(path: string, method: "POST" | "DELETE") {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You are not signed in. Please log in again.");
  }
  const token = await user.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // Guard against the request being silently rewritten to an SPA HTML
  // shell (e.g. when deployed behind a static host without an /api proxy).
  // Successful admin responses are always JSON or empty (204).
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.toLowerCase().includes("application/json");
  const isEmpty =
    res.status === 204 || res.headers.get("content-length") === "0";

  if (!res.ok) {
    let detail = "";
    try {
      detail = isJson ? ((await res.json())?.error ?? "") : await res.text();
    } catch {
      detail = "";
    }
    throw new Error(`HTTP ${res.status}${detail ? `: ${detail}` : ""}`);
  }

  if (!isEmpty && !isJson) {
    throw new Error(
      "Admin API request was misrouted (non-JSON response). " +
        "Set VITE_API_BASE_URL to your api-server origin.",
    );
  }

  return res;
}

type FirestoreUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  schoolName?: string;
  school?: { name?: string };
  posts?: number;
  followers?: number;
  isBanned?: boolean;
  verificationStatus?: "approved" | "pending" | "rejected";
};

export default function UsersPage() {
  const [allUsers, setAllUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const next: FirestoreUser[] = snap.docs.map((d) => {
          const data = d.data() as Omit<FirestoreUser, "id">;
          return { id: d.id, ...data };
        });
        setAllUsers(next);
        setLoading(false);
      },
      (err) => {
        console.error("users onSnapshot failed:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const users = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allUsers.filter((u) => {
      if (bannedFilter === "suspended" && !u.isBanned) return false;
      if (bannedFilter === "active" && u.isBanned) return false;
      if (!q) return true;
      return (
        (u.name ?? "").toLowerCase().includes(q) ||
        (u.username ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [allUsers, search, bannedFilter]);

  async function manuallyVerify(userId: string, name: string) {
    setVerifyLoading(userId);
    try {
      await setDoc(
        doc(db, "verificationRequests", userId),
        {
          userName: name,
          status: "approved",
          appliedAt: serverTimestamp(),
          reviewedAt: serverTimestamp(),
          manualGrant: true,
        },
        { merge: true },
      );
      await updateDoc(doc(db, "users", userId), {
        verificationStatus: "approved",
      });
    } catch (err) {
      console.error("Manual verify failed:", err);
      alert("Could not verify user. Try again.");
    }
    setVerifyLoading(null);
  }

  async function revokeVerification(userId: string) {
    setVerifyLoading(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        verificationStatus: "rejected",
      });
      await setDoc(
        doc(db, "verificationRequests", userId),
        { status: "rejected", reviewedAt: serverTimestamp() },
        { merge: true },
      );
    } catch (err) {
      console.error("Revoke verification failed:", err);
    }
    setVerifyLoading(null);
  }

  async function setBanned(userId: string, banned: boolean) {
    setActionLoading(userId);
    try {
      await callAdminApi(
        `/api/users/${encodeURIComponent(userId)}/${banned ? "ban" : "unban"}`,
        "POST",
      );
    } catch (err) {
      console.error("Ban toggle failed:", err);
      alert(
        `Could not ${banned ? "suspend" : "unsuspend"} user. ${
          err instanceof Error ? err.message : ""
        }`.trim(),
      );
    }
    setActionLoading(null);
  }

  async function deleteUser(userId: string) {
    setActionLoading(userId);
    try {
      await callAdminApi(
        `/api/users/${encodeURIComponent(userId)}`,
        "DELETE",
      );
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete user failed:", err);
      alert(
        `Could not delete user. ${
          err instanceof Error ? err.message : ""
        }`.trim(),
      );
    }
    setActionLoading(null);
  }

  function getInitials(name?: string) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage student accounts across the platform
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-users"
          className="flex-1 px-3 py-2 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={bannedFilter}
          onChange={(e) => setBannedFilter(e.target.value)}
          data-testid="select-filter-banned"
          className="px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm bg-card border border-border rounded-xl">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-xl">
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Adjust your search or filters
            </p>
          </div>
        ) : (
          users.map((user) => {
            const isApproved = user.verificationStatus === "approved";
            const schoolName = user.schoolName ?? user.school?.name ?? "";
            return (
              <div
                key={user.id}
                data-testid={`row-user-${user.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {getInitials(user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.name ?? "—"}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                        user.isBanned
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {user.isBanned ? "Suspended" : "Active"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username ?? "—"} · {user.email ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {schoolName}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {user.posts ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {user.followers ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isApproved ? (
                    <button
                      onClick={() => revokeVerification(user.id)}
                      disabled={verifyLoading === user.id}
                      title="Revoke verification badge"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <svg viewBox="0 0 24 24" fill="#D4A53A" className="w-3.5 h-3.5">
                        <polygon points="12,2 14.6,8.6 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9.4,8.6" />
                      </svg>
                      Verified
                    </button>
                  ) : (
                    <button
                      onClick={() => manuallyVerify(user.id, user.name ?? "")}
                      disabled={verifyLoading === user.id}
                      title="Manually verify this user"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <polygon points="12,2 14.6,8.6 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9.4,8.6" />
                      </svg>
                      {verifyLoading === user.id ? "…" : "Verify"}
                    </button>
                  )}
                  {user.isBanned ? (
                    <button
                      onClick={() => setBanned(user.id, false)}
                      disabled={actionLoading === user.id}
                      data-testid={`button-unban-${user.id}`}
                      title="Unsuspend user"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Unsuspend
                    </button>
                  ) : (
                    <button
                      onClick={() => setBanned(user.id, true)}
                      disabled={actionLoading === user.id}
                      data-testid={`button-ban-${user.id}`}
                      title="Suspend user"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setConfirmDeleteId(user.id);
                      setConfirmDeleteName(user.name ?? "this user");
                    }}
                    data-testid={`button-delete-${user.id}`}
                    title="Delete user"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-foreground text-center mb-1">
              Delete Account
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Permanently delete{" "}
              <span className="font-semibold text-foreground">
                {confirmDeleteName}
              </span>
              's profile? This removes their Firestore data AND their Firebase
              Auth login. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={actionLoading === confirmDeleteId}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-muted hover:bg-muted/70 text-foreground transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDeleteId)}
                disabled={actionLoading === confirmDeleteId}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {actionLoading === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
