import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  limit,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { School, User } from "./AuthContext";

export interface Post {
  id: string;
  author: User;
  authorId: string;
  content: string;
  mediaUri?: string;
  mediaType?: "image" | "video" | "audio";
  // Optional audio length in seconds, only set when mediaType === "audio"
  audioDurationSec?: number;
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
  isLiked: boolean;
  isFollowing: boolean;
  isPinned: boolean;
  createdAt: string;
  tags: string[];
  // Optional category — used for "Campus Jams" section feed.
  category?: "general" | "campus_jams";
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention";
  actor: { name: string; avatar: string; username: string };
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface FeedContextType {
  posts: Post[];
  trendingPosts: Post[];
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  addPost: (
    content: string,
    tags: string[],
    author: User,
    mediaUri?: string,
    mediaType?: "image" | "video" | "audio",
    options?: { category?: "general" | "campus_jams"; audioDurationSec?: number },
  ) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  sharePost: (postId: string) => void;
  toggleLike: (postId: string) => void;
  toggleFollow: (postId: string) => void;
  getPostComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, author: User) => void;
  subscribeToComments: (postId: string) => () => void;
  markNotificationsRead: () => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

// Comprehensive list of Liberian schools across all 15 counties.
// Universities, colleges, and high schools.
export const SCHOOLS_LIST: School[] = [
  // ─── Universities & Colleges ───────────────────────────────────────────────
  { id: "u1", name: "University of Liberia", type: "university", location: "Monrovia, Montserrado" },
  { id: "u2", name: "Cuttington University", type: "university", location: "Suakoko, Bong County" },
  { id: "u3", name: "United Methodist University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u4", name: "African Methodist Episcopal University (AMEU)", type: "university", location: "Monrovia, Montserrado" },
  { id: "u5", name: "African Methodist Episcopal Zion University (AMEZU)", type: "university", location: "Monrovia, Montserrado" },
  { id: "u6", name: "Stella Maris Polytechnic", type: "university", location: "Monrovia, Montserrado" },
  { id: "u7", name: "Starz University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u8", name: "Adventist University of West Africa (AUWA)", type: "university", location: "Monrovia, Montserrado" },
  { id: "u9", name: "Benson Votech University", type: "university", location: "Kakata, Margibi County" },
  { id: "u10", name: "A.M. Dogliotti College of Medicine", type: "university", location: "Monrovia, Montserrado" },
  { id: "u11", name: "William V.S. Tubman University", type: "university", location: "Harper, Maryland County" },
  { id: "u12", name: "Telcom University of Liberia", type: "university", location: "Monrovia, Montserrado" },
  { id: "u13", name: "Diaconia University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u14", name: "Lofa Community College", type: "university", location: "Voinjama, Lofa County" },
  { id: "u15", name: "Bong County Technical College", type: "university", location: "Gbarnga, Bong County" },
  { id: "u16", name: "Nimba County Community College", type: "university", location: "Sanniquellie, Nimba County" },
  { id: "u17", name: "Grand Bassa Community College", type: "university", location: "Buchanan, Grand Bassa" },
  { id: "u18", name: "Liberia Baptist Theological Seminary", type: "university", location: "Paynesville, Montserrado" },
  { id: "u19", name: "Mother Patern College of Health Sciences", type: "university", location: "Monrovia, Montserrado" },
  { id: "u20", name: "Don Bosco Polytechnic Institute", type: "university", location: "Monrovia, Montserrado" },
  { id: "u21", name: "Smythe Institute of Management & Technology", type: "university", location: "Monrovia, Montserrado" },
  { id: "u22", name: "BlueCrest University College", type: "university", location: "Monrovia, Montserrado" },
  { id: "u23", name: "African Bible College University", type: "university", location: "Yekepa, Nimba County" },
  { id: "u24", name: "LICOSESS — Liberia International Christian College", type: "university", location: "Ganta, Nimba County" },

  // ─── High Schools — Montserrado County ─────────────────────────────────────
  { id: "h1", name: "College of West Africa (CWA)", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h2", name: "Monrovia Consolidated School System (MCSS)", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h3", name: "Capitol Hill High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h4", name: "St. Patrick's High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h5", name: "St. Teresa's Convent High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h6", name: "St. Gregory Catholic School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h7", name: "B.W. Harris Episcopal High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h8", name: "New Testament High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h9", name: "Buduburam Community School", type: "high_school", location: "Buduburam, Montserrado" },
  { id: "h10", name: "G.W. Gibson High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h11", name: "D. Twe Memorial High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h12", name: "William V.S. Tubman High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h13", name: "G.W. Harley High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h14", name: "Haywood Mission High School", type: "high_school", location: "Arthington, Montserrado" },
  { id: "h15", name: "Bishop John Collins High School", type: "high_school", location: "Caldwell, Montserrado" },
  { id: "h16", name: "Effort Baptist High School", type: "high_school", location: "Paynesville, Montserrado" },
  { id: "h17", name: "Ricks Institute", type: "high_school", location: "Virginia, Montserrado" },
  { id: "h18", name: "Carver Mission School", type: "high_school", location: "Brewerville, Montserrado" },
  { id: "h19", name: "Liberia Christian High School", type: "high_school", location: "Paynesville, Montserrado" },
  { id: "h20", name: "Cathedral Catholic High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h21", name: "St. Mary's Catholic High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h22", name: "Christ the King Catholic School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h23", name: "Lutheran Training Institute", type: "high_school", location: "Salayea, Lofa County" },
  { id: "h24", name: "Daniel E. Howard Memorial High", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h25", name: "Doe Community High School", type: "high_school", location: "Paynesville, Montserrado" },

  // ─── High Schools — Margibi County ─────────────────────────────────────────
  { id: "h26", name: "Booker Washington Institute (BWI)", type: "high_school", location: "Kakata, Margibi County" },
  { id: "h27", name: "Kakata Rural Teacher Training Institute", type: "high_school", location: "Kakata, Margibi County" },
  { id: "h28", name: "C.H. Rennie Hospital High School", type: "high_school", location: "Kakata, Margibi County" },
  { id: "h29", name: "Firestone High School", type: "high_school", location: "Harbel, Margibi County" },

  // ─── High Schools — Bong County ────────────────────────────────────────────
  { id: "h30", name: "Bong Mines High School", type: "high_school", location: "Bong Mines, Bong County" },
  { id: "h31", name: "Gbarnga Central High School", type: "high_school", location: "Gbarnga, Bong County" },
  { id: "h32", name: "C.H. Henries Memorial High School", type: "high_school", location: "Gbarnga, Bong County" },

  // ─── High Schools — Nimba County ───────────────────────────────────────────
  { id: "h33", name: "Sanniquellie Central High School", type: "high_school", location: "Sanniquellie, Nimba County" },
  { id: "h34", name: "Ganta United Methodist High School", type: "high_school", location: "Ganta, Nimba County" },
  { id: "h35", name: "ELWA Academy", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h36", name: "Yekepa LAMCO High School", type: "high_school", location: "Yekepa, Nimba County" },
  { id: "h37", name: "Tappita Central High School", type: "high_school", location: "Tappita, Nimba County" },

  // ─── High Schools — Lofa County ────────────────────────────────────────────
  { id: "h38", name: "Voinjama Multilateral High School", type: "high_school", location: "Voinjama, Lofa County" },
  { id: "h39", name: "Zorzor Central High School", type: "high_school", location: "Zorzor, Lofa County" },
  { id: "h40", name: "Foya Central High School", type: "high_school", location: "Foya, Lofa County" },

  // ─── High Schools — Grand Gedeh ────────────────────────────────────────────
  { id: "h41", name: "Zwedru Multilateral High School", type: "high_school", location: "Zwedru, Grand Gedeh County" },
  { id: "h42", name: "Tubman Wilson Institute", type: "high_school", location: "Zwedru, Grand Gedeh County" },

  // ─── High Schools — Bomi, Grand Cape Mount, Gbarpolu, Grand Bassa ─────────
  { id: "h43", name: "Tubmanburg Central High School", type: "high_school", location: "Tubmanburg, Bomi County" },
  { id: "h44", name: "Robertsport Central High School", type: "high_school", location: "Robertsport, Grand Cape Mount" },
  { id: "h45", name: "Bopolu High School", type: "high_school", location: "Bopolu, Gbarpolu County" },
  { id: "h46", name: "Buchanan Central High School", type: "high_school", location: "Buchanan, Grand Bassa" },
  { id: "h47", name: "St. Peter Claver Catholic High", type: "high_school", location: "Buchanan, Grand Bassa" },

  // ─── High Schools — Maryland, Grand Kru, River Gee, Sinoe, River Cess ─────
  { id: "h48", name: "Cape Palmas High School", type: "high_school", location: "Harper, Maryland County" },
  { id: "h49", name: "Barclayville Central High", type: "high_school", location: "Barclayville, Grand Kru" },
  { id: "h50", name: "Fish Town Central High", type: "high_school", location: "Fish Town, River Gee" },
  { id: "h51", name: "Greenville Multilateral High", type: "high_school", location: "Greenville, Sinoe County" },
  { id: "h52", name: "Cestos City Central High", type: "high_school", location: "Cestos City, River Cess" },
];

function tsToString(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts?.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched: Post[] = snap.docs.map((d) => {
        const data = d.data();
        const likedBy: string[] = data.likedBy ?? [];
        return {
          ...data,
          id: d.id,
          authorId: data.authorId ?? data.author?.id ?? "",
          likedBy,
          isLiked: currentUserId ? likedBy.includes(currentUserId) : false,
          isFollowing: false,
          isPinned: data.isPinned ?? false,
          createdAt: tsToString(data.createdAt),
        } as Post;
      });
      fetched.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPosts(fetched);
      setIsLoading(false);
    }, () => {
      setIsLoading(false);
    });

    return unsub;
  }, [currentUserId]);

  const addPost = useCallback(async (
    content: string,
    tags: string[],
    author: User,
    mediaUri?: string,
    mediaType?: "image" | "video" | "audio",
    options?: { category?: "general" | "campus_jams"; audioDurationSec?: number },
  ) => {
    // Upload media to Firebase Storage so we store a permanent HTTPS URL
    // (not a local blob: or file: URI which breaks for other users)
    let finalMediaUri: string | null = null;
    if (mediaUri) {
      try {
        const response = await fetch(mediaUri);
        const blob = await response.blob();
        const ext = mediaType === "video" ? "mp4" : mediaType === "audio" ? "m4a" : "jpg";
        const storageRef = ref(storage, `posts/${author.id}/${Date.now()}.${ext}`);
        await uploadBytes(storageRef, blob);
        finalMediaUri = await getDownloadURL(storageRef);
      } catch {
        // If upload fails, post without media rather than storing a broken local URI
        finalMediaUri = null;
      }
    }

    // Strip phone from the embedded author snapshot — posts are world-readable
    // and we never want a user's phone number leaking into the public feed.
    const { phone: _omitPhone, ...publicAuthor } = author;
    void _omitPhone;
    await addDoc(collection(db, "posts"), {
      author: publicAuthor,
      authorId: author.id,
      content,
      mediaUri: finalMediaUri,
      mediaType: finalMediaUri ? (mediaType ?? null) : null,
      audioDurationSec: mediaType === "audio" && options?.audioDurationSec
        ? options.audioDurationSec
        : null,
      category: options?.category ?? "general",
      likes: 0,
      likedBy: [],
      comments: 0,
      shares: 0,
      isFollowing: false,
      createdAt: serverTimestamp(),
      tags,
    });
    try {
      await updateDoc(doc(db, "users", author.id), { posts: increment(1) });
    } catch {
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await deleteDoc(doc(db, "posts", postId));
  }, []);

  const sharePost = useCallback((postId: string) => {
    updateDoc(doc(db, "posts", postId), { shares: increment(1) }).catch(() => {});
  }, []);

  const toggleLike = useCallback((postId: string) => {
    if (!currentUserId) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const ref = doc(db, "posts", postId);
    if (post.isLiked) {
      updateDoc(ref, {
        likes: increment(-1),
        likedBy: arrayRemove(currentUserId),
      });
    } else {
      updateDoc(ref, {
        likes: increment(1),
        likedBy: arrayUnion(currentUserId),
      });
    }
  }, [posts, currentUserId]);

  const toggleFollow = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, isFollowing: !p.isFollowing } : p)
    );
  }, []);

  const getPostComments = useCallback((postId: string) => {
    return comments[postId] ?? [];
  }, [comments]);

  const addComment = useCallback(async (postId: string, content: string, author: User) => {
    const newComment: Comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      author,
      content,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    // Optimistic update
    setComments((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] ?? [])],
    }));
    try {
      // Persist to Firestore subcollection
      await addDoc(collection(db, "posts", postId, "comments"), {
        author,
        content,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "posts", postId), { comments: increment(1) });
    } catch {
    }
  }, []);

  const subscribeToComments = useCallback((postId: string) => {
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const fetched: Comment[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          author: data.author as User,
          content: data.content ?? "",
          likes: Array.isArray(data.likedBy) ? data.likedBy.length : (data.likes ?? 0),
          isLiked: false,
          createdAt: tsToString(data.createdAt),
        };
      });
      // Sort newest first for display
      const sorted = [...fetched].reverse();
      setComments((prev) => ({ ...prev, [postId]: sorted }));
    }, () => {
      // Ignore errors (e.g., no subcollection yet)
    });
    return unsub;
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const trendingPosts = [...posts]
    .sort((a, b) => (b.likes + b.comments * 2 + b.shares * 3) - (a.likes + a.comments * 2 + a.shares * 3))
    .slice(0, 10);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <FeedContext.Provider
      value={{
        posts,
        trendingPosts,
        notifications,
        unreadCount,
        isLoading,
        currentUserId,
        setCurrentUserId,
        addPost,
        deletePost,
        sharePost,
        toggleLike,
        toggleFollow,
        getPostComments,
        addComment,
        subscribeToComments,
        markNotificationsRead,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

export const SAMPLE_USERS: User[] = [];
