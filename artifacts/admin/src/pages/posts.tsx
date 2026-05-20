import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type FirestorePost = {
  id: string;
  content?: string;
  authorName?: string;
  authorUsername?: string;
  schoolName?: string;
  author?: { name?: string; username?: string; schoolName?: string };
  likes?: number;
  comments?: number;
  isFlagged?: boolean;
  isPinned?: boolean;
  createdAt?: unknown;
};

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

export default function PostsPage() {
  const [allPosts, setAllPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [flaggedFilter, setFlaggedFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(500));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllPosts(
          snap.docs.map((d) => {
            const data = d.data() as Omit<FirestorePost, "id">;
            return { id: d.id, ...data };
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.error("posts onSnapshot failed:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const posts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPosts.filter((p) => {
      if (flaggedFilter === "flagged" && !p.isFlagged) return false;
      if (flaggedFilter === "normal" && p.isFlagged) return false;
      if (!q) return true;
      const authorName = p.authorName ?? p.author?.name ?? "";
      return (
        (p.content ?? "").toLowerCase().includes(q) ||
        authorName.toLowerCase().includes(q)
      );
    });
  }, [allPosts, search, flaggedFilter]);

  function formatDate(v: unknown) {
    const ms = tsToMs(v);
    if (!ms) return "";
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  async function togglePin(p: FirestorePost) {
    setActionLoading(p.id);
    try {
      await updateDoc(doc(db, "posts", p.id), { isPinned: !p.isPinned });
    } catch (err) {
      console.error("Pin failed:", err);
      alert("Could not update post. Try again.");
    }
    setActionLoading(null);
  }

  async function flagPost(p: FirestorePost) {
    setActionLoading(p.id);
    try {
      await updateDoc(doc(db, "posts", p.id), { isFlagged: true });
    } catch (err) {
      console.error("Flag failed:", err);
      alert("Could not flag post. Try again.");
    }
    setActionLoading(null);
  }

  async function deletePost(id: string) {
    setActionLoading(id);
    try {
      await deleteDoc(doc(db, "posts", id));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete post failed:", err);
      alert("Could not delete post. Try again.");
    }
    setActionLoading(null);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Content Moderation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review and moderate posts across the platform
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-posts"
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={flaggedFilter}
          onChange={(e) => setFlaggedFilter(e.target.value)}
          data-testid="select-filter-flagged"
          className="px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Posts</option>
          <option value="flagged">Flagged</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-card-border rounded-xl p-5 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <p className="text-sm font-medium text-foreground">No posts found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adjust your search or filters
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="list-posts">
          {posts.map((post) => {
            const authorName = post.authorName ?? post.author?.name ?? "Unknown";
            const authorUsername =
              post.authorUsername ?? post.author?.username ?? "";
            const schoolName = post.schoolName ?? post.author?.schoolName ?? "";
            return (
              <div
                key={post.id}
                className={`bg-card border rounded-xl p-5 shadow-sm transition-colors ${
                  post.isFlagged ? "border-chart-3/50 bg-chart-3/5" : "border-card-border"
                }`}
                data-testid={`card-post-${post.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground shrink-0">
                      {getInitials(authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {authorName}
                        </span>
                        {authorUsername && (
                          <span className="text-xs text-muted-foreground">
                            @{authorUsername}
                          </span>
                        )}
                        {schoolName && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {schoolName}
                            </span>
                          </>
                        )}
                        {post.isFlagged && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-chart-3/15 text-chart-3">
                            Flagged
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-1 line-clamp-2">
                        {post.content ?? ""}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {post.likes ?? 0} likes
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.comments ?? 0} comments
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => togglePin(post)}
                      disabled={actionLoading === post.id}
                      data-testid={`button-pin-post-${post.id}`}
                      className={`p-1.5 rounded-lg transition-colors ${
                        post.isPinned
                          ? "text-primary bg-primary/10 hover:bg-primary/20"
                          : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                      }`}
                      title={post.isPinned ? "Unpin post" : "Pin post to top of feed"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill={post.isPinned ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                      >
                        <path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                      </svg>
                    </button>
                    {!post.isFlagged && (
                      <button
                        onClick={() => flagPost(post)}
                        disabled={actionLoading === post.id}
                        data-testid={`button-flag-post-${post.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-chart-3 hover:bg-chart-3/10 transition-colors"
                        title="Flag for review"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                          <line x1="4" y1="22" x2="4" y2="15" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteId(post.id)}
                      data-testid={`button-delete-post-${post.id}`}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete post"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">
              Delete Post
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This post will be permanently removed from the platform. This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deleteId)}
                disabled={actionLoading === deleteId}
                data-testid="button-confirm-delete-post"
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {actionLoading === deleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
