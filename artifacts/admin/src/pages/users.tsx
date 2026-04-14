import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  getListUsersQueryKey,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
} from "@workspace/api-client-react";

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>("");

  const params: { search?: string; banned?: boolean } = {};
  if (search) params.search = search;
  if (bannedFilter === "suspended") params.banned = true;
  if (bannedFilter === "active") params.banned = false;

  const usersQuery = useListUsers(params, {
    query: { queryKey: getListUsersQueryKey(params) },
  });

  const suspendMutation = useBanUser({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }) },
  });

  const unsuspendMutation = useUnbanUser({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }) },
  });

  const deleteMutation = useDeleteUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setConfirmDeleteId(null);
      },
    },
  });

  const users = usersQuery.data ?? [];

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage student accounts across the platform</p>
      </div>

      {/* Filters */}
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

      {/* User cards */}
      <div className="space-y-2">
        {usersQuery.isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm bg-card border border-border rounded-xl">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center bg-card border border-border rounded-xl">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-muted-foreground">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">No users found</p>
            <p className="text-xs text-muted-foreground mt-1">Adjust your search or filters</p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              data-testid={`row-user-${user.id}`}
              className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                {getInitials(user.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    user.isBanned
                      ? "bg-amber-500/10 text-amber-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {user.isBanned ? "Suspended" : "Active"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">@{user.username} · {user.email}</p>
                <p className="text-xs text-muted-foreground truncate">{user.schoolName}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 shrink-0 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground">{user.postCount}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{user.followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {user.isBanned ? (
                  <button
                    onClick={() => unsuspendMutation.mutate({ id: user.id })}
                    disabled={unsuspendMutation.isPending}
                    data-testid={`button-unban-${user.id}`}
                    title="Unsuspend user"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {/* Unlock icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 019.9-1"/>
                    </svg>
                    Unsuspend
                  </button>
                ) : (
                  <button
                    onClick={() => suspendMutation.mutate({ id: user.id })}
                    disabled={suspendMutation.isPending}
                    data-testid={`button-ban-${user.id}`}
                    title="Suspend user"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {/* Lock icon */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => { setConfirmDeleteId(user.id); setConfirmDeleteName(user.name); }}
                  data-testid={`button-delete-${user.id}`}
                  title="Delete user"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap"
                >
                  {/* Trash icon */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-destructive">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-foreground text-center mb-1">Delete Account</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Permanently delete <span className="font-semibold text-foreground">{confirmDeleteName}</span>'s account? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-muted hover:bg-muted/70 text-foreground transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: confirmDeleteId })}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
