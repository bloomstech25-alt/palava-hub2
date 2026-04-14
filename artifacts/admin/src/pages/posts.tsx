import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPosts,
  getListPostsQueryKey,
  useDeletePost,
  useFlagPost,
  usePinPost,
} from "@workspace/api-client-react";

export default function PostsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [flaggedFilter, setFlaggedFilter] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params: { search?: string; flagged?: boolean } = {};
  if (search) params.search = search;
  if (flaggedFilter === "flagged") params.flagged = true;
  if (flaggedFilter === "normal") params.flagged = false;

  const postsQuery = useListPosts(params, {
    query: { queryKey: getListPostsQueryKey(params) },
  });

  const deleteMutation = useDeletePost({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
        setDeleteId(null);
      },
    },
  });

  const flagMutation = useFlagPost({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
    },
  });

  const pinMutation = usePinPost({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
    },
  });

  const posts = postsQuery.data ?? [];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Content Moderation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review and moderate posts across the platform</p>
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

      {postsQuery.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-muted-foreground">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No posts found</p>
          <p className="text-xs text-muted-foreground mt-1">Adjust your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="list-posts">
          {posts.map((post) => (
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
                    {getInitials(post.authorName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
                      <span className="text-xs text-muted-foreground">@{post.authorUsername}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{post.schoolName}</span>
                      {post.isFlagged && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-chart-3/15 text-chart-3">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                          </svg>
                          Flagged
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-1 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">{post.likes} likes</span>
                      <span className="text-xs text-muted-foreground">{post.comments} comments</span>
                      <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => pinMutation.mutate({ id: post.id })}
                    disabled={pinMutation.isPending}
                    data-testid={`button-pin-post-${post.id}`}
                    className={`p-1.5 rounded-lg transition-colors ${
                      post.isPinned
                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    title={post.isPinned ? "Unpin post" : "Pin post to top of feed"}
                  >
                    <svg viewBox="0 0 24 24" fill={post.isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <path d="M12 2l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z"/>
                    </svg>
                  </button>
                  {!post.isFlagged && (
                    <button
                      onClick={() => flagMutation.mutate({ id: post.id })}
                      disabled={flagMutation.isPending}
                      data-testid={`button-flag-post-${post.id}`}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-chart-3 hover:bg-chart-3/10 transition-colors"
                      title="Flag for review"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                        <line x1="4" y1="22" x2="4" y2="15"/>
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
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Delete Post</h2>
            <p className="text-sm text-muted-foreground mb-6">This post will be permanently removed from the platform. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteId })}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete-post"
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
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
