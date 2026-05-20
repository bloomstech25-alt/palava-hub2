import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Heart,
  MessageCircle,
  Repeat2,
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
    id?: string;
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
  repostedBy?: string[];
  tags?: string[];
  category?: string;
  createdAt?: { seconds: number } | Date | number;
};

export function PostCard({ post }: { post: Post }) {
  const { profile } = useAuth();

  const liked = useMemo(
    () =>
      !!profile &&
      Array.isArray(post.likedBy) &&
      post.likedBy.includes(profile.id),
    [post.likedBy, profile],
  );
  const reposted = useMemo(
    () =>
      !!profile &&
      Array.isArray(post.repostedBy) &&
      post.repostedBy.includes(profile.id),
    [post.repostedBy, profile],
  );

  const [optLiked, setOptLiked] = useState<boolean | null>(null);
  const [optLikeCount, setOptLikeCount] = useState<number | null>(null);
  const [optReposted, setOptReposted] = useState<boolean | null>(null);
  const [optShareCount, setOptShareCount] = useState<number | null>(null);

  const isLiked = optLiked ?? liked;
  const likeCount = optLikeCount ?? post.likes ?? 0;
  const isReposted = optReposted ?? reposted;
  const shareCount = optShareCount ?? post.shares ?? 0;

  async function toggleLike() {
    if (!profile) return;
    const next = !isLiked;
    setOptLiked(next);
    setOptLikeCount(likeCount + (next ? 1 : -1));
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
      setOptLiked(null);
      setOptLikeCount(null);
    }
  }

  async function toggleRepost() {
    if (!profile) return;
    const next = !isReposted;
    setOptReposted(next);
    setOptShareCount(shareCount + (next ? 1 : -1));
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "posts", post.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) return;
        const data = snap.data() as { shares?: number; repostedBy?: string[] };
        const arr = new Set(data.repostedBy ?? []);
        if (next) arr.add(profile.id);
        else arr.delete(profile.id);
        tx.update(ref, { repostedBy: [...arr], shares: arr.size });
      });
    } catch {
      setOptReposted(null);
      setOptShareCount(null);
    }
  }

  async function shareExternal() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${import.meta.env.BASE_URL}post/${post.id}`
        : `/post/${post.id}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({
          title: "Palava Hub",
          text: post.content?.slice(0, 100) ?? "Check out this post",
          url,
        });
        return;
      }
    } catch {
      /* user dismissed */
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch {
      /* ignore */
    }
  }

  const authorId = post.author?.id ?? post.authorId ?? "";

  return (
    <article className="bg-fb-card rounded-xl shadow-sm border border-fb-border overflow-hidden">
      <header className="p-4 flex items-start gap-3">
        <Link href={authorId ? `/profile/${authorId}` : "/"}>
          <Avatar
            name={post.author?.name ?? "?"}
            src={post.author?.avatar ?? undefined}
            size={40}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              href={authorId ? `/profile/${authorId}` : "/"}
              className="font-semibold text-[15px] truncate hover:underline"
            >
              {post.author?.name ?? "Unknown"}
            </Link>
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
            <Link href={`/post/${post.id}`} className="hover:underline">
              {timeAgo(post.createdAt)}
            </Link>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-fb-hover">
          <MoreHorizontal className="w-5 h-5 text-fb-text-secondary" />
        </button>
      </header>

      {post.content && (
        <Link href={`/post/${post.id}`}>
          <p className="px-4 pb-3 text-[15px] whitespace-pre-wrap break-words hover:bg-fb-hover/40">
            {renderContentWithLinks(post.content)}
          </p>
        </Link>
      )}

      {post.mediaUri && post.mediaType === "image" && (
        <Link href={`/post/${post.id}`}>
          <img
            src={post.mediaUri}
            alt=""
            className="w-full max-h-[600px] object-cover bg-black"
            loading="lazy"
          />
        </Link>
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

      {(likeCount > 0 || (post.comments ?? 0) > 0 || shareCount > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-fb-text-secondary">
          <div className="flex items-center gap-1">
            {likeCount > 0 && (
              <>
                <span className="inline-flex w-5 h-5 rounded-full bg-palava-red items-center justify-center">
                  <Heart className="w-3 h-3 text-white" fill="white" />
                </span>
                <span>{likeCount}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {(post.comments ?? 0) > 0 && (
              <Link href={`/post/${post.id}`} className="hover:underline">
                {post.comments} comments
              </Link>
            )}
            {shareCount > 0 && <span>{shareCount} reposts</span>}
          </div>
        </div>
      )}

      <div className="px-2 py-1 border-t border-fb-border grid grid-cols-4">
        <button
          onClick={toggleLike}
          className={`py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            isLiked ? "text-palava-red" : "text-fb-text-secondary"
          }`}
        >
          <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
          <span className="hidden sm:inline">Like</span>
        </button>
        <Link
          href={`/post/${post.id}`}
          className="py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm text-fb-text-secondary"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Comment</span>
        </Link>
        <button
          onClick={toggleRepost}
          className={`py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            isReposted ? "text-[#17BF63]" : "text-fb-text-secondary"
          }`}
        >
          <Repeat2 className="w-5 h-5" />
          <span className="hidden sm:inline">Repost</span>
        </button>
        <button
          onClick={shareExternal}
          className="py-2 rounded-lg hover:bg-fb-hover flex items-center justify-center gap-2 font-semibold text-sm text-fb-text-secondary"
        >
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </article>
  );
}

function renderContentWithLinks(content: string): React.ReactNode {
  const parts = content.split(/(\s+)/);
  return parts.map((part, i) => {
    if (/^#\w+$/.test(part)) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link
          key={i}
          href={`/topic/${tag}`}
          className="text-palava-red hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
