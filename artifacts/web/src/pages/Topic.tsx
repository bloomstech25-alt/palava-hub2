import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard, type Post } from "@/components/PostCard";
import { Hash } from "lucide-react";

export default function Topic({ tag }: { tag: string }) {
  const needle = tag.toLowerCase();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qq = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(qq, (snap) => {
      const all = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Post, "id">),
      }));
      const matched = all.filter((p) => {
        const tagHit =
          Array.isArray(p.tags) &&
          p.tags.some((t) => t.toLowerCase() === needle);
        const contentHit =
          typeof p.content === "string" &&
          new RegExp(`#${needle}\\b`, "i").test(p.content);
        return tagHit || contentHit;
      });
      setPosts(matched);
      setLoading(false);
    });
    return () => unsub();
  }, [needle]);

  return (
    <div className="space-y-4">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-palava-gold/20 flex items-center justify-center">
          <Hash className="w-5 h-5 text-palava-gold" />
        </div>
        <div>
          <h1 className="font-bold text-lg">#{tag}</h1>
          <p className="text-xs text-fb-text-secondary">
            {posts.length} post{posts.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {loading && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          Loading…
        </div>
      )}
      {!loading && posts.length === 0 && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          No posts yet for #{tag}.
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
