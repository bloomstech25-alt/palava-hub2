import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PostCard, type Post } from "@/components/PostCard";
import { Music2 } from "lucide-react";

export default function CampusJams() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    let unsubPrimary: (() => void) | null = null;
    let unsubFallback: (() => void) | null = null;
    let active = true;

    const primary = query(
      collection(db, "posts"),
      where("category", "==", "campus_jams"),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    function subscribeFallback() {
      if (!active) return;
      setUsedFallback(true);
      const fallback = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(100),
      );
      unsubFallback = onSnapshot(fallback, (s) => {
        if (!active) return;
        setPosts(
          s.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }))
            .filter(
              (p) =>
                p.category === "campus_jams" ||
                (Array.isArray(p.tags) &&
                  p.tags.some((t) => t.toLowerCase() === "campusjams")),
            ),
        );
        setLoading(false);
      });
    }

    unsubPrimary = onSnapshot(
      primary,
      (snap) => {
        if (!active) return;
        setPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Post, "id">),
          })),
        );
        setLoading(false);
      },
      () => {
        if (unsubPrimary) unsubPrimary();
        unsubPrimary = null;
        subscribeFallback();
      },
    );

    return () => {
      active = false;
      if (unsubPrimary) unsubPrimary();
      if (unsubFallback) unsubFallback();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#7B61FF]/10 flex items-center justify-center">
          <Music2 className="w-5 h-5 text-[#7B61FF]" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Campus Jams 🎵</h1>
          <p className="text-xs text-fb-text-secondary">
            Music, vibes, and moments from Liberian campuses. Tag your posts
            with <span className="font-mono">#CampusJams</span>.
            {usedFallback && " (Filtered locally)"}
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
          No campus jams yet. Be the first!
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
