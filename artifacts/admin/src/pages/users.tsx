import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUsers,
  getListUsersQueryKey,
  useBanUser,
  useUnbanUser,
} from "@workspace/api-client-react";

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [bannedFilter, setBannedFilter] = useState<string>("");

  const params: { search?: string; banned?: boolean } = {};
  if (search) params.search = search;
  if (bannedFilter === "banned") params.banned = true;
  if (bannedFilter === "active") params.banned = false;

  const usersQuery = useListUsers(params, {
    query: { queryKey: getListUsersQueryKey(params) },
  });

  const banMutation = useBanUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    },
  });

  const unbanMutation = useUnbanUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
      },
    },
  });

  const users = usersQuery.data ?? [];

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
          <option value="banned">Banned</option>
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
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground max-w-40 truncate">{user.schoolName}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">{user.postCount}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">{user.followerCount}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      user.isBanned
                        ? "bg-destructive/10 text-destructive"
                        : "bg-chart-2/10 text-chart-2"
                    }`}>
                      {user.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.isBanned ? (
                      <button
                        onClick={() => unbanMutation.mutate({ id: user.id })}
                        disabled={unbanMutation.isPending}
                        data-testid={`button-unban-${user.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-chart-2/10 text-chart-2 hover:bg-chart-2/20 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => banMutation.mutate({ id: user.id })}
                        disabled={banMutation.isPending}
                        data-testid={`button-ban-${user.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-60"
                      >
                        Ban
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
