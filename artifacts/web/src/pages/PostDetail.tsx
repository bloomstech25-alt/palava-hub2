import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { PostCard, type Post } from "@/components/PostCard";
import { Avatar } from "@/components/Avatar";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Comment = {
  id: string;
  authorId: string;
  author?: {
    name?: string;
    username?: string;
    avatar?: string | null;
  };
  content: string;
  createdAt?: { seconds: number };
};

export default function PostDetail({ postId }: { postId: string }) {
  const { profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "posts", postId),
      (snap) => {
        if (snap.exists()) {
          setPost({ id: snap.id, ...(snap.data() as Omit<Post, "id">) });
        } else {
          setNotFound(true);
        }
      },
      () => setNotFound(true),
    );
    return () => unsub();
  }, [postId]);

  useEffect(() => {
    const qq = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc"),
    );
    const unsub = onSnapshot(qq, (snap) => {
      setComments(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Comment, "id">),
        })),
      );
    });
    return () => unsub();
  }, [postId]);

  async function send() {
    if (!profile) return;
    const t = text.trim();
    if (!t) return;
    setBusy(true);
    const original = text;
    setText("");
    try {
      await Promise.all([
        addDoc(collection(db, "posts", postId, "comments"), {
          authorId: profile.id,
          author: {
            id: profile.id,
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar ?? null,
          },
          content: t,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "posts", postId), { comments: increment(1) }),
      ]);
    } catch {
      setText(original);
    } finally {
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
        Post not found.{" "}
        <Link href="/" className="text-palava-red hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-fb-text-secondary hover:text-fb-text"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      {post ? (
        <PostCard post={post} />
      ) : (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          Loading…
        </div>
      )}

      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border">
        <div className="p-3 border-b border-fb-border font-bold text-sm">
          Comments ({comments.length})
        </div>

        {profile && (
          <div className="p-3 flex items-start gap-2 border-b border-fb-border">
            <Avatar name={profile.name} src={profile.avatar} size={36} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Write a comment…"
              rows={1}
              className="flex-1 resize-none bg-fb-bg rounded-2xl px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-palava-red/40 max-h-32"
            />
            <button
              onClick={send}
              disabled={busy || !text.trim()}
              className="p-2 rounded-full bg-palava-red text-white hover:bg-palava-red-dark disabled:opacity-50"
              aria-label="Send"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="p-6 text-center text-sm text-fb-text-secondary">
            No comments yet. Start the conversation.
          </div>
        ) : (
          <ul className="divide-y divide-fb-border">
            {comments.map((c) => (
              <li key={c.id} className="p-3 flex items-start gap-2">
                <Link href={`/profile/${c.authorId}`}>
                  <Avatar
                    name={c.author?.name ?? "?"}
                    src={c.author?.avatar ?? undefined}
                    size={36}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-fb-bg rounded-2xl px-3 py-2">
                    <Link
                      href={`/profile/${c.authorId}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {c.author?.name ?? "User"}
                    </Link>
                    <div className="text-[15px] whitespace-pre-wrap break-words">
                      {c.content}
                    </div>
                  </div>
                  <div className="text-[11px] text-fb-text-secondary mt-1 px-3">
                    {timeAgo(c.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
