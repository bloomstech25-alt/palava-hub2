import { useMemo, useState } from "react";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  CheckCircle2,
} from "lucide-react";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";
import { timeAgo } from "@/lib/utils";

export type Post = {
  id: string;
  author?: {
    name?: string;
    username?: string;
    avatar?: string | null;
    school?: { name?: string } | null;
    isVerified?: boolean;
  };
  authorId?: string;
  content?: string;
  mediaUri?: string | null;
  mediaType?: "image" | "video" | "audio" | null;
  likes?: number;
  likedBy?: string[];
  comments?: number;
  shares?: number;
  createdAt?: { seconds: number } | Date | number;
};

export function PostCard({ post }: { post: Post }) {
  const { profile } = useAuth();
  const liked = useMemo(
    () => !!profile && Array.isArray(post.likedBy) && post.likedBy.includes(profile.id),
    [post.likedBy, profile],
  );
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCount, setOptimisticCount] = useState<number | null>(null);

  const isLiked = optimisticLiked ?? liked;
  const likeCount = optimisticCount ?? post.likes ?? 0;

  async function toggleLike() {
    if (!profile) return;
    const next = !isLiked;
    setOptimisticLiked(next);
    setOptimisticCount(likeCount + (next ? 1 : -1));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "posts", post.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as { likes?: number; likedBy?: string[] };
        const arr = new Set(data.likedBy ?? []);
        if (next) arr.add(profile.id);
        else arr.delete(profile.id);
        tx.update(ref, { likedBy: [...arr], likes: arr.size });
      });
    } catch {
      setOptimisticLiked(null);
      setOptimisticCount(null);
    }
  }

  return (
    <article className="bg-fb-card rounded-xl shadow-sm border border-fb-border overflow-hidden">
      <header className="p-4 flex items-start gap-3">
        <Avatar
          name={post.author?.name ?? "?"}
          src={post.author?.avatar ?? undefined}
          size={40}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-[15px] truncate">
              {post.author?.name ?? "Unknown"}
            </span>
            {post.author?.isVerified && (
              <CheckCircle2
                className="w-4 h-4"
                style={{ color: "#D4A12A", fill: "#D4A12A" }}
              />
            )}
          </div>
          <div className="text-xs text-fb-text-secondary flex items-center gap-1 truncate">
            {post.author?.school?.name && (
              <>
                <span className="truncate">{post.author.school.name}</span>
                <span>·</span>
              </>
            )}
            <span>{timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-fb-hover">
          <MoreHorizontal className="w-5 h-5 text-fb-text-secondary" />
        </button>
      </header>

      {post.content && (
        <p className="px-4 pb-3 text-[15px] whitespace-pre-wrap break-words">
          {post.content}
        </p>
      )}

      {post.mediaUri && post.mediaType === "image" && (
        <img
          src={post.mediaUri}
          alt=""
          className="w-full max-h-[600px] object-cover bg-black"
          loading="lazy"
        />
      )}
      {post.mediaUri && post.mediaType === "video" && (
        <video
          src={post.mediaUri}
          controls
          className="w-full max-h-[600px] bg-black"
        />
      )}
      {post.mediaUri && post.mediaType === "audio" && (
        <div className="px-4 pb-3">
          <audio src={post.mediaUri} controls className="w-full" />
        </div>
      )}

      {(likeCount > 0 || (post.comments ?? 0) > 0 || (post.shares ?? 0) > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-fb-text-secondary">
          <div className="flex items-center gap-1">
            {likeCount > 0 && (
              <>
                <span className="inline-flex w-5 h-5 rounded-full bg-fb-blue items-center justify-center">
                  <ThumbsUp className="w-3 h-3 text-white" fill="white" />
                </span>
                <span>{likeCount}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(post.comments ?? 0) > 0 && <span>{post.comments} comments</span>}
            {(post.shares ?? 0) > 0 && <span>{post.shares} shares</span>}
          </div>
        </div>
      )}

      <div className="px-2 py-1 border-t border-fb-border grid grid-cols-3">
        <button
          onClick={toggleLike}
          className={`py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            isLiked ? "text-fb-blue" : "text-fb-text-secondary"
          }`}
        >
          <ThumbsUp className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
          Like
        </button>
        <button className="py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm text-fb-text-secondary">
          <MessageCircle className="w-5 h-5" />
          Comment
        </button>
        <button className="py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm text-fb-text-secondary">
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </article>
  );
}
