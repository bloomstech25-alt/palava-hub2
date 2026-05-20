import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Avatar } from "@/components/Avatar";
import { PostCard, type Post } from "@/components/PostCard";
import { Search as SearchIcon } from "lucide-react";

type UserHit = {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
  school?: { name?: string };
};

export default function Search() {
  const searchString = useSearch();
  const initialQ = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("q") ?? "";
  }, [searchString]);
  const [q, setQ] = useState(initialQ);
  const [users, setUsers] = useState<UserHit[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      setUsers([]);
      setPosts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [uSnap, pSnap] = await Promise.all([
          getDocs(query(collection(db, "users"), limit(100))),
          getDocs(
            query(
              collection(db, "posts"),
              orderBy("createdAt", "desc"),
              limit(100),
            ),
          ),
        ]);
        if (cancelled) return;
        const uHits = uSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<UserHit, "id">) }))
          .filter((u) => {
            const hay = `${u.name ?? ""} ${u.username ?? ""} ${u.school?.name ?? ""}`.toLowerCase();
            return hay.includes(needle);
          })
          .slice(0, 25);
        const pHits = pSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }))
          .filter((p) => {
            const hay = `${p.content ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
            return hay.includes(needle);
          })
          .slice(0, 25);
        setUsers(uHits);
        setPosts(pHits);
      } catch {
        setUsers([]);
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4">
        <div className="flex items-center gap-2 bg-fb-bg rounded-full px-4 py-2">
          <SearchIcon className="w-5 h-5 text-fb-text-secondary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users, posts, hashtags…"
            autoFocus
            className="bg-transparent outline-none flex-1 text-[15px]"
          />
        </div>
      </div>

      {loading && (
        <div className="bg-fb-card rounded-xl p-6 text-center text-sm text-fb-text-secondary">
          Searching…
        </div>
      )}

      {!loading && q.trim() && users.length === 0 && posts.length === 0 && (
        <div className="bg-fb-card rounded-xl p-6 text-center text-sm text-fb-text-secondary">
          No results for "{q}".
        </div>
      )}

      {users.length > 0 && (
        <section className="bg-fb-card rounded-xl shadow-sm border border-fb-border">
          <h2 className="px-4 py-3 border-b border-fb-border font-bold text-sm">
            People
          </h2>
          <ul className="divide-y divide-fb-border">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-fb-hover"
                >
                  <Avatar
                    name={u.name ?? "?"}
                    src={u.avatar}
                    size={44}
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{u.name}</div>
                    <div className="text-xs text-fb-text-secondary truncate">
                      @{u.username}
                      {u.school?.name ? ` · ${u.school.name}` : ""}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {posts.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-bold text-sm text-fb-text-secondary px-2">
            Posts
          </h2>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      )}
    </div>
  );
}
