import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { School, User } from "./AuthContext";

export interface Post {
  id: string;
  author: User;
  content: string;
  image?: string;
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
  addPost: (content: string, tags: string[], author: User) => Promise<void>;
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

const SAMPLE_USERS: User[] = [
  {
    id: "u2", name: "Fatima Kollie", username: "fatima_k", email: "fatima@ul.edu.lr",
    school: SCHOOLS_LIST[0], bio: "Computer Science @ UL. Passionate about tech for Liberia 🇱🇷", avatar: "https://i.pravatar.cc/150?img=5",
    followers: 3400, following: 210, posts: 54, joinedAt: "2024-08-15",
  },
  {
    id: "u3", name: "Emmanuel Flomo", username: "eflomo", email: "eflomo@cuttington.edu.lr",
    school: SCHOOLS_LIST[1], bio: "Law student. Debate champion. Cuttington '26.", avatar: "https://i.pravatar.cc/150?img=12",
    followers: 2100, following: 430, posts: 123, joinedAt: "2024-07-01",
  },
  {
    id: "u4", name: "Mary Sumo", username: "marysumo", email: "mary@umu.edu.lr",
    school: SCHOOLS_LIST[2], bio: "Public health & community development. UMU.", avatar: "https://i.pravatar.cc/150?img=9",
    followers: 1780, following: 570, posts: 78, joinedAt: "2023-12-01",
  },
  {
    id: "u5", name: "James Nyekan", username: "jnyekan", email: "james@starz.edu.lr",
    school: SCHOOLS_LIST[4], bio: "Electrical engineering, robotics enthusiast", avatar: "https://i.pravatar.cc/150?img=15",
    followers: 892, following: 180, posts: 32, joinedAt: "2025-01-10",
  },
  {
    id: "u6", name: "Grace Tarwoe", username: "gracet", email: "grace@cwa.edu.lr",
    school: SCHOOLS_LIST[12], bio: "CWA class of 2025. STEM ambassador.", avatar: "https://i.pravatar.cc/150?img=20",
    followers: 640, following: 290, posts: 41, joinedAt: "2024-06-20",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1", author: SAMPLE_USERS[0],
    content: "Just built a mobile app that helps UL students track campus bus schedules in real time. Presenting it at the tech fair next Friday — come through and support!",
    likes: 247, comments: 38, shares: 12, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    tags: ["UL", "Tech", "StudentLife", "STEM"],
  },
  {
    id: "p2", author: SAMPLE_USERS[1],
    content: "Cuttington debate team just won the inter-university championship! Three years of hard work and it all paid off tonight. Suakoko is buzzing right now!",
    likes: 892, comments: 124, shares: 67, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ["Cuttington", "Debate", "Victory", "StudentLife"],
  },
  {
    id: "p3", author: SAMPLE_USERS[2],
    content: "UMU public health students — our community outreach in Sinkor last weekend reached 200+ families. This is why we study. More updates coming soon!",
    likes: 576, comments: 89, shares: 41, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    tags: ["UMU", "PublicHealth", "Community", "Liberia"],
  },
  {
    id: "p4", author: SAMPLE_USERS[3],
    content: "Study tip that changed my semester: Stop re-reading notes. Start teaching. Explain concepts to a friend or out loud to yourself. My retention went from ~40% to ~85%.",
    likes: 3200, comments: 412, shares: 890, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    tags: ["StudyTips", "Academics", "Productivity"],
  },
  {
    id: "p5", author: SAMPLE_USERS[4],
    content: "CWA science club just placed 2nd in the national science competition! So proud of our team. Liberia's future scientists are right here.",
    likes: 445, comments: 67, shares: 34, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    tags: ["CWA", "STEM", "Science", "Liberia"],
  },
  {
    id: "p6", author: SAMPLE_USERS[0],
    content: "Shoutout to every Liberian student grinding right now. The roads aren't always easy but you're building something real. Keep going — we see you!",
    likes: 1340, comments: 156, shares: 210, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    tags: ["Liberia", "StudentLife", "Motivation", "Campus"],
  },
];

const INITIAL_COMMENTS: Record<string, Comment[]> = {
  p1: [
    {
      id: "c1", author: SAMPLE_USERS[4],
      content: "This is amazing! Will you open source the code? Would love to contribute.",
      likes: 12, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "c2", author: SAMPLE_USERS[2],
      content: "We need this at UMU too! The bus situation is a struggle every morning.",
      likes: 8, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ],
  p2: [
    {
      id: "c3", author: SAMPLE_USERS[0],
      content: "Absolutely deserved! Cuttington represents! 🏆",
      likes: 45, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  p4: [
    {
      id: "c4", author: SAMPLE_USERS[1],
      content: "The Feynman technique! Changed my study game completely.",
      likes: 234, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
    {
      id: "c5", author: SAMPLE_USERS[2],
      content: "This plus spaced repetition = unstoppable. Try Anki too.",
      likes: 178, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    },
  ],
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "like",
    actor: { name: "Fatima Kollie", avatar: "https://i.pravatar.cc/150?img=5", username: "fatima_k" },
    message: "liked your post",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "n2", type: "follow",
    actor: { name: "Emmanuel Flomo", avatar: "https://i.pravatar.cc/150?img=12", username: "eflomo" },
    message: "started following you",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "n3", type: "comment",
    actor: { name: "Mary Sumo", avatar: "https://i.pravatar.cc/150?img=9", username: "marysumo" },
    message: "commented on your post",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "n4", type: "like",
    actor: { name: "James Nyekan", avatar: "https://i.pravatar.cc/150?img=15", username: "jnyekan" },
    message: "liked your post",
    isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "n5", type: "mention",
    actor: { name: "Grace Tarwoe", avatar: "https://i.pravatar.cc/150?img=20", username: "gracet" },
    message: "mentioned you in a post",
    isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
];

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>(INITIAL_COMMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem("@studentconnect/posts");
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
    await AsyncStorage.setItem("@studentconnect/posts", JSON.stringify(newPosts));
  }, []);

  const addPost = useCallback(async (content: string, tags: string[], author: User) => {
    const newPost: Post = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      author,
      content,
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
