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
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }),
    },
  });

  const unsuspendMutation = useUnbanUser({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListUsersQueryKey() }),
    },
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

  function openDeleteConfirm(id: string, name: string) {
    setConfirmDeleteId(id);
    setConfirmDeleteName(name);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Users</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage student accounts across the platform</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-users"
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={bannedFilter}
          onChange={(e) => setBannedFilter(e.target.value)}
          data-testid="select-filter-banned"
          className="px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Users</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
        {usersQuery.isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
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
          <table className="w-full" data-testid="table-users">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">User</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">School</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Posts</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Followers</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-user-${user.id}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-40 truncate">{user.schoolName}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">{user.postCount}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">{user.followerCount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      user.isBanned
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-chart-2/10 text-chart-2"
                    }`}>
                      {user.isBanned ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {user.isBanned ? (
                        <button
                          onClick={() => unsuspendMutation.mutate({ id: user.id })}
                          disabled={unsuspendMutation.isPending}
                          data-testid={`button-unban-${user.id}`}
                          className="px-3 py-1.5 text-xs font-medium bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 rounded-lg transition-colors disabled:opacity-60"
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendMutation.mutate({ id: user.id })}
                          disabled={suspendMutation.isPending}
                          data-testid={`button-ban-${user.id}`}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-lg transition-colors disabled:opacity-60"
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => openDeleteConfirm(user.id, user.name)}
                        data-testid={`button-delete-${user.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              Are you sure you want to permanently delete <span className="font-semibold text-foreground">{confirmDeleteName}</span>'s account? This cannot be undone.
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
