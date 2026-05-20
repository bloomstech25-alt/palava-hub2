import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type UserProfile } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import { PostCard, type Post } from "@/components/PostCard";
import { CheckCircle2, MessageCircle, UserPlus, UserCheck } from "lucide-react";

export default function Profile({ userId }: { userId: string }) {
  const { profile: me, followUser, unfollowUser, isFollowing } = useAuth();
  const [, navigate] = useLocation();

  const targetId = userId === "me" ? me?.id ?? "" : userId;
  const isMe = !!me && targetId === me.id;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyFollow, setBusyFollow] = useState(false);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", targetId));
        if (cancelled) return;
        if (snap.exists()) {
          setUser({ id: snap.id, ...(snap.data() as Omit<UserProfile, "id">) });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  useEffect(() => {
    if (!targetId) return;
    const qq = query(
      collection(db, "posts"),
      where("authorId", "==", targetId),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      qq,
      (snap) => {
        setPosts(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Post, "id">),
          })),
        );
      },
      () => {
        /* ignore — likely missing composite index; fall back to client filter */
      },
    );
    return () => unsub();
  }, [targetId]);

  if (!targetId || (!loading && !user)) {
    return (
      <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
        User not found.
      </div>
    );
  }

  const following = !!me && isFollowing(targetId);

  async function onToggleFollow() {
    if (!me || isMe) return;
    setBusyFollow(true);
    try {
      if (following) await unfollowUser(targetId);
      else await followUser(targetId);
    } finally {
      setBusyFollow(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border overflow-hidden">
        <div className="h-32 sm:h-44 bg-gradient-to-r from-palava-red to-palava-gold" />
        <div className="px-4 sm:px-6 pb-4 -mt-12 sm:-mt-16 flex items-end gap-4 flex-wrap">
          <div className="ring-4 ring-white rounded-full">
            <Avatar name={user?.name ?? "?"} src={user?.avatar} size={96} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <h1 className="text-xl font-bold truncate">
                {user?.name ?? "Loading…"}
              </h1>
              {user?.isVerified && (
                <CheckCircle2
                  className="w-5 h-5"
                  style={{ color: "#D4A12A", fill: "#D4A12A" }}
                />
              )}
            </div>
            <div className="text-sm text-fb-text-secondary">
              @{user?.username}
            </div>
            {user?.school?.name && (
              <div className="text-xs text-fb-text-secondary mt-0.5 truncate">
                🎓 {user.school.name}
              </div>
            )}
          </div>
          {!isMe && me && (
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleFollow}
                disabled={busyFollow}
                className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 disabled:opacity-50 ${
                  following
                    ? "bg-fb-bg hover:bg-fb-hover text-fb-text"
                    : "bg-palava-red hover:bg-palava-red-dark text-white"
                }`}
              >
                {following ? (
                  <>
                    <UserCheck className="w-4 h-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/messages/${targetId}`)}
                className="px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 bg-fb-bg hover:bg-fb-hover text-fb-text"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>
            </div>
          )}
          {isMe && (
            <Link
              href="/settings"
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-fb-bg hover:bg-fb-hover text-fb-text"
            >
              Edit profile
            </Link>
          )}
        </div>
        {user?.bio && (
          <div className="px-4 sm:px-6 pb-4 text-sm text-fb-text">
            {user.bio}
          </div>
        )}
        <div className="px-4 sm:px-6 pb-4 flex items-center gap-6 text-sm">
          <div>
            <span className="font-bold">{user?.posts ?? 0}</span>{" "}
            <span className="text-fb-text-secondary">Posts</span>
          </div>
          <div>
            <span className="font-bold">{user?.followers ?? 0}</span>{" "}
            <span className="text-fb-text-secondary">Followers</span>
          </div>
          <div>
            <span className="font-bold">{user?.following ?? 0}</span>{" "}
            <span className="text-fb-text-secondary">Following</span>
          </div>
        </div>
      </div>

      <h2 className="font-bold text-fb-text-secondary text-sm px-2">Posts</h2>
      {posts.length === 0 ? (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          No posts yet.
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
