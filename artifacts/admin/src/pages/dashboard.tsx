import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StatCardProps {
  label: string;
  value: number | undefined;
  color?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color = "bg-primary", icon }: StatCardProps) {
  return (
    <div
      className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-4 shadow-sm"
      data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div
        className={`w-11 h-11 rounded-lg ${color} flex items-center justify-center text-white shrink-0`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">
          {value ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

type Stats = {
  totalUsers: number;
  totalPosts: number;
  totalSchools: number;
  bannedUsers: number;
  flaggedPosts: number;
  newUsersToday: number;
  newPostsToday: number;
  universities: number;
  highSchools: number;
};

const EMPTY: Stats = {
  totalUsers: 0,
  totalPosts: 0,
  totalSchools: 0,
  bannedUsers: 0,
  flaggedPosts: 0,
  newUsersToday: 0,
  newPostsToday: 0,
  universities: 0,
  highSchools: 0,
};

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function tsToMs(v: unknown): number {
  if (!v) return 0;
  const obj = v as { seconds?: number; toMillis?: () => number };
  if (typeof obj.toMillis === "function") return obj.toMillis();
  if (typeof obj.seconds === "number") return obj.seconds * 1000;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ready = { users: false, posts: false, schools: false };
    function maybeDoneLoading() {
      if (ready.users && ready.posts && ready.schools) setLoading(false);
    }

    const todayMs = startOfTodayMs();

    const unsubUsers = onSnapshot(
      collection(db, "users"),
      (snap) => {
        let banned = 0;
        let newToday = 0;
        snap.docs.forEach((d) => {
          const x = d.data() as { isBanned?: boolean; createdAt?: unknown };
          if (x.isBanned) banned++;
          if (tsToMs(x.createdAt) >= todayMs) newToday++;
        });
        setStats((s) => ({
          ...s,
          totalUsers: snap.size,
          bannedUsers: banned,
          newUsersToday: newToday,
        }));
        ready.users = true;
        maybeDoneLoading();
      },
      () => {
        ready.users = true;
        maybeDoneLoading();
      },
    );

    const unsubPosts = onSnapshot(
      collection(db, "posts"),
      (snap) => {
        let flagged = 0;
        let newToday = 0;
        snap.docs.forEach((d) => {
          const x = d.data() as { isFlagged?: boolean; createdAt?: unknown };
          if (x.isFlagged) flagged++;
          if (tsToMs(x.createdAt) >= todayMs) newToday++;
        });
        setStats((s) => ({
          ...s,
          totalPosts: snap.size,
          flaggedPosts: flagged,
          newPostsToday: newToday,
        }));
        ready.posts = true;
        maybeDoneLoading();
      },
      () => {
        ready.posts = true;
        maybeDoneLoading();
      },
    );

    const unsubSchools = onSnapshot(
      collection(db, "schools"),
      (snap) => {
        let unis = 0;
        let highs = 0;
        snap.docs.forEach((d) => {
          const t = (d.data() as { type?: string }).type;
          if (t === "university") unis++;
          else if (t === "high_school") highs++;
        });
        setStats((s) => ({
          ...s,
          totalSchools: snap.size,
          universities: unis,
          highSchools: highs,
        }));
        ready.schools = true;
        maybeDoneLoading();
      },
      () => {
        ready.schools = true;
        maybeDoneLoading();
      },
    );

    return () => {
      unsubUsers();
      unsubPosts();
      unsubSchools();
    };
  }, []);

  const data = loading ? null : stats;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform overview — Palava Hub Liberia
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-card-border rounded-xl p-5 h-20 animate-pulse"
            />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Users"
              value={data.totalUsers}
              color="bg-primary"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              }
            />
            <StatCard
              label="Total Posts"
              value={data.totalPosts}
              color="bg-chart-2"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            <StatCard
              label="Total Schools"
              value={data.totalSchools}
              color="bg-chart-3"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              }
            />
            <StatCard
              label="Banned Users"
              value={data.bannedUsers}
              color="bg-destructive"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Flagged Posts"
              value={data.flaggedPosts}
              color="bg-chart-3"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              }
            />
            <StatCard
              label="New Users Today"
              value={data.newUsersToday}
              color="bg-chart-4"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                </svg>
              }
            />
            <StatCard
              label="New Posts Today"
              value={data.newPostsToday}
              color="bg-chart-1"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              }
            />
            <StatCard
              label="Universities"
              value={data.universities}
              color="bg-chart-2"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-card border border-card-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                School Breakdown
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Universities</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width:
                            data.totalSchools > 0
                              ? `${(data.universities / data.totalSchools) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-6 text-right">
                      {data.universities}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Senior High Schools</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-chart-2 rounded-full"
                        style={{
                          width:
                            data.totalSchools > 0
                              ? `${(data.highSchools / data.totalSchools) * 100}%`
                              : "0%",
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-6 text-right">
                      {data.highSchools}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Platform Health
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Banned Users</span>
                  <span
                    className={`text-sm font-semibold ${
                      data.bannedUsers > 0 ? "text-destructive" : "text-chart-2"
                    }`}
                  >
                    {data.bannedUsers > 0 ? `${data.bannedUsers} banned` : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Flagged Posts</span>
                  <span
                    className={`text-sm font-semibold ${
                      data.flaggedPosts > 0 ? "text-chart-3" : "text-chart-2"
                    }`}
                  >
                    {data.flaggedPosts > 0 ? `${data.flaggedPosts} flagged` : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="text-sm font-semibold text-chart-2">
                    {data.totalUsers - data.bannedUsers}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

