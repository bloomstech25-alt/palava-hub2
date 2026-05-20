import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostComposer } from "@/components/PostComposer";
import { PostCard, type Post } from "@/components/PostCard";

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qq = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      qq,
      (snap) => {
        setPosts(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) })),
        );
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  return (
    <div className="space-y-4">
      <PostComposer />
      {loading && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          Loading feed…
        </div>
      )}
      {!loading && posts.length === 0 && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          No posts yet. Be the first to share something!
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
