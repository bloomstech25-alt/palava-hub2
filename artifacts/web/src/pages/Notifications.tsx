import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { timeAgo } from "@/lib/utils";
import { Bell, Heart, MessageCircle, Repeat2 } from "lucide-react";

type MyPost = {
  id: string;
  content?: string;
  likes?: number;
  likedBy?: string[];
  comments?: number;
  shares?: number;
  repostedBy?: string[];
  createdAt?: { seconds: number };
};

export default function Notifications() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const qq = query(
      collection(db, "posts"),
      where("authorId", "==", profile.id),
      orderBy("createdAt", "desc"),
      limit(20),
    );
    const unsub = onSnapshot(
      qq,
      (snap) => {
        setPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<MyPost, "id">),
          })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, [profile]);

  const activity = posts
    .map((p) => {
      const total =
        (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
      return { post: p, total };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-3">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-palava-red/10 flex items-center justify-center">
          <Bell className="w-5 h-5 text-palava-red" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Notifications</h1>
          <p className="text-xs text-fb-text-secondary">
            Engagement on your posts. For per-action push alerts, use the
            mobile app.
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          Loading…
        </div>
      )}

      {!loading && activity.length === 0 && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          No engagement yet. Share something to get noticed!
        </div>
      )}

      {activity.map(({ post }) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
          className="block bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 hover:bg-fb-hover"
        >
          <div className="text-xs text-fb-text-secondary mb-2">
            {timeAgo(post.createdAt)}
          </div>
          <div className="text-sm font-medium truncate mb-2">
            "{(post.content ?? "").slice(0, 80) || "Your post"}"
          </div>
          <div className="flex items-center gap-4 text-sm">
            {(post.likes ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-palava-red">
                <Heart className="w-4 h-4" fill="currentColor" />
                <strong>{post.likes}</strong>
                <span className="text-fb-text-secondary">
                  like{post.likes === 1 ? "" : "s"}
                </span>
              </span>
            )}
            {(post.comments ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-palava-gold">
                <MessageCircle className="w-4 h-4" />
                <strong>{post.comments}</strong>
                <span className="text-fb-text-secondary">
                  comment{post.comments === 1 ? "" : "s"}
                </span>
              </span>
            )}
            {(post.shares ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[#17BF63]">
                <Repeat2 className="w-4 h-4" />
                <strong>{post.shares}</strong>
                <span className="text-fb-text-secondary">
                  repost{post.shares === 1 ? "" : "s"}
                </span>
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
