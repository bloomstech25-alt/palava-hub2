import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { School, User } from "./AuthContext";

export interface Post {
  id: string;
  author: User;
  content: string;
  mediaUri?: string;
  mediaType?: "image" | "video";
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isFollowing: boolean;
  createdAt: string;
  tags: string[];
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
  addPost: (content: string, tags: string[], author: User, mediaUri?: string, mediaType?: "image" | "video") => Promise<void>;
  toggleLike: (postId: string) => void;
  toggleFollow: (postId: string) => void;
  getPostComments: (postId: string) => Comment[];
  addComment: (postId: string, content: string, author: User) => void;
  markNotificationsRead: () => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

export const SCHOOLS_LIST: School[] = [
  // Liberian Universities
  { id: "u1", name: "University of Liberia", type: "university", location: "Monrovia, Montserrado" },
  { id: "u2", name: "Cuttington University", type: "university", location: "Suakoko, Bong County" },
  { id: "u3", name: "United Methodist University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u4", name: "African Methodist Episcopal University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u5", name: "Starz University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u6", name: "Adventist University of West Africa", type: "university", location: "Monrovia, Montserrado" },
  { id: "u7", name: "Benson Votech University", type: "university", location: "Kakata, Margibi County" },
  { id: "u8", name: "A.M. Dogliotti College of Medicine", type: "university", location: "Monrovia, Montserrado" },
  { id: "u9", name: "William V.S. Tubman University", type: "university", location: "Harper, Maryland County" },
  { id: "u10", name: "Telcom University of Liberia", type: "university", location: "Monrovia, Montserrado" },
  { id: "u11", name: "Diaconia University", type: "university", location: "Monrovia, Montserrado" },
  { id: "u12", name: "Lofa Community College", type: "university", location: "Voinjama, Lofa County" },
  // Liberian Senior High Schools
  { id: "h1", name: "College of West Africa (CWA)", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h2", name: "Monrovia Consolidated School System (MCSS)", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h3", name: "Capitol Hill High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h4", name: "Booker Washington Institute (BWI)", type: "high_school", location: "Kakata, Margibi County" },
  { id: "h5", name: "Ricks Institute", type: "high_school", location: "Virginia, Montserrado" },
  { id: "h6", name: "St. Patrick's High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h7", name: "St. Teresa's Convent High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h8", name: "B.W. Harris Episcopal High School", type: "high_school", location: "Monrovia, Montserrado" },
  { id: "h9", name: "Haywood Mission High School", type: "high_school", location: "Arthington, Montserrado" },
  { id: "h10", name: "Sanniquellie Central High School", type: "high_school", location: "Sanniquellie, Nimba County" },
  { id: "h11", name: "Kakata Rural Teacher Training Institute", type: "high_school", location: "Kakata, Margibi County" },
  { id: "h12", name: "Ganta United Methodist High School", type: "high_school", location: "Ganta, Nimba County" },
  { id: "h13", name: "Voinjama Public School", type: "high_school", location: "Voinjama, Lofa County" },
  { id: "h14", name: "Zwedru Multilateral High School", type: "high_school", location: "Zwedru, Grand Gedeh County" },
  { id: "h15", name: "Tubmanburg Central High School", type: "high_school", location: "Tubmanburg, Bomi County" },
];

const SAMPLE_USERS: User[] = [];

const INITIAL_POSTS: Post[] = [];

const INITIAL_COMMENTS: Record<string, Comment[]> = {};

const INITIAL_NOTIFICATIONS: Notification[] = [];

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("@palavahub/posts");
        if (stored) {
          setPosts(JSON.parse(stored));
        } else {
          setPosts(INITIAL_POSTS);
        }
      } catch {
        setPosts(INITIAL_POSTS);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const savePosts = useCallback(async (newPosts: Post[]) => {
    setPosts(newPosts);
    await AsyncStorage.setItem("@palavahub/posts", JSON.stringify(newPosts));
  }, []);

  const addPost = useCallback(async (content: string, tags: string[], author: User, mediaUri?: string, mediaType?: "image" | "video") => {
    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      author,
      content,
      mediaUri,
      mediaType,
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isFollowing: false,
      createdAt: new Date().toISOString(),
      tags,
    };
    const updated = [newPost, ...posts];
    await savePosts(updated);
  }, [posts, savePosts]);

  const toggleLike = useCallback((postId: string) => {
    const updated = posts.map((p) =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
        : p
    );
    savePosts(updated);
  }, [posts, savePosts]);

  const toggleFollow = useCallback((postId: string) => {
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, isFollowing: !p.isFollowing } : p
    );
    savePosts(updated);
  }, [posts, savePosts]);

  const getPostComments = useCallback((postId: string) => {
    return comments[postId] ?? [];
  }, [comments]);

  const addComment = useCallback((postId: string, content: string, author: User) => {
    const newComment: Comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      author,
      content,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => ({
      ...prev,
      [postId]: [newComment, ...(prev[postId] ?? [])],
    }));
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p)
    );
  }, []);

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const trendingPosts = [...posts].sort(
    (a, b) => (b.likes + b.comments * 2 + b.shares * 3) - (a.likes + a.comments * 2 + a.shares * 3)
  ).slice(0, 10);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <FeedContext.Provider
      value={{
        posts,
        trendingPosts,
        notifications,
        unreadCount,
        isLoading,
        addPost,
        toggleLike,
        toggleFollow,
        getPostComments,
        addComment,
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

export { SAMPLE_USERS };
