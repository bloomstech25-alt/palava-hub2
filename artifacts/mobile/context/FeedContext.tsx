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
  { id: "s1", name: "MIT", type: "university", location: "Cambridge, MA" },
  { id: "s2", name: "Stanford University", type: "university", location: "Stanford, CA" },
  { id: "s3", name: "Harvard University", type: "university", location: "Cambridge, MA" },
  { id: "s4", name: "New York University (NYU)", type: "university", location: "New York, NY" },
  { id: "s5", name: "UC Berkeley", type: "university", location: "Berkeley, CA" },
  { id: "s6", name: "Yale University", type: "university", location: "New Haven, CT" },
  { id: "s7", name: "Princeton University", type: "university", location: "Princeton, NJ" },
  { id: "s8", name: "Columbia University", type: "university", location: "New York, NY" },
  { id: "s9", name: "University of Chicago", type: "university", location: "Chicago, IL" },
  { id: "s10", name: "UCLA", type: "university", location: "Los Angeles, CA" },
  { id: "s11", name: "University of Michigan", type: "university", location: "Ann Arbor, MI" },
  { id: "s12", name: "Duke University", type: "university", location: "Durham, NC" },
  { id: "s13", name: "Northwestern University", type: "university", location: "Evanston, IL" },
  { id: "s14", name: "Johns Hopkins University", type: "university", location: "Baltimore, MD" },
  { id: "s15", name: "Dartmouth College", type: "university", location: "Hanover, NH" },
  { id: "s16", name: "Georgia Tech", type: "university", location: "Atlanta, GA" },
  { id: "s17", name: "University of Texas at Austin", type: "university", location: "Austin, TX" },
  { id: "s18", name: "Penn State University", type: "university", location: "State College, PA" },
  { id: "s19", name: "Ohio State University", type: "university", location: "Columbus, OH" },
  { id: "s20", name: "University of Florida", type: "university", location: "Gainesville, FL" },
  { id: "h1", name: "Phillips Academy Andover", type: "high_school", location: "Andover, MA" },
  { id: "h2", name: "Stuyvesant High School", type: "high_school", location: "New York, NY" },
  { id: "h3", name: "Thomas Jefferson High School", type: "high_school", location: "Alexandria, VA" },
  { id: "h4", name: "BASIS Scottsdale", type: "high_school", location: "Scottsdale, AZ" },
  { id: "h5", name: "Exeter Academy", type: "high_school", location: "Exeter, NH" },
];

const SAMPLE_USERS: User[] = [
  {
    id: "u2", name: "Priya Sharma", username: "priya_s", email: "priya@example.com",
    school: SCHOOLS_LIST[1], bio: "Design thinking & UX", avatar: "https://i.pravatar.cc/150?img=5",
    followers: 892, following: 210, posts: 54, joinedAt: "2024-08-15",
  },
  {
    id: "u3", name: "Marcus Williams", username: "marcusw", email: "marcus@example.com",
    school: SCHOOLS_LIST[2], bio: "Pre-law, debate captain", avatar: "https://i.pravatar.cc/150?img=12",
    followers: 2100, following: 430, posts: 123, joinedAt: "2024-07-01",
  },
  {
    id: "u4", name: "Sofia Chen", username: "sofiachen", email: "sofia@example.com",
    school: SCHOOLS_LIST[3], bio: "Film & media studies", avatar: "https://i.pravatar.cc/150?img=9",
    followers: 3400, following: 570, posts: 210, joinedAt: "2023-12-01",
  },
  {
    id: "u5", name: "James Okafor", username: "jamesokafor", email: "james@example.com",
    school: SCHOOLS_LIST[4], bio: "Electrical engineering, robotics club", avatar: "https://i.pravatar.cc/150?img=15",
    followers: 640, following: 180, posts: 32, joinedAt: "2025-01-10",
  },
  {
    id: "u6", name: "Aisha Rahman", username: "aisharahman", email: "aisha@example.com",
    school: SCHOOLS_LIST[0], bio: "Math & economics major", avatar: "https://i.pravatar.cc/150?img=20",
    followers: 1780, following: 290, posts: 78, joinedAt: "2024-06-20",
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1", author: SAMPLE_USERS[0],
    content: "Just finished my final machine learning project — built a model that predicts student dropout rates with 89% accuracy. Super proud of this one!",
    likes: 247, comments: 38, shares: 12, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    tags: ["MachineLearning", "Stanford", "AI"],
  },
  {
    id: "p2", author: SAMPLE_USERS[1],
    content: "Harvard mock trial team just swept the regional championship! Three years of preparation and it all came together tonight. Huge shoutout to everyone who believed in us.",
    likes: 892, comments: 124, shares: 67, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    tags: ["Harvard", "MockTrial", "Victory"],
  },
  {
    id: "p3", author: SAMPLE_USERS[2],
    content: "NYU film students — are you submitting to the Tribeca student showcase? Deadline is March 15. Happy to review rough cuts if you need a second pair of eyes.",
    likes: 134, comments: 56, shares: 23, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    tags: ["NYU", "Film", "Tribeca", "StudentLife"],
  },
  {
    id: "p4", author: SAMPLE_USERS[3],
    content: "Our robotics team qualified for nationals! We built an autonomous drone that can navigate obstacle courses in under 90 seconds. UC Berkeley, let's go!",
    likes: 576, comments: 89, shares: 41, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    tags: ["UCBerkeley", "Robotics", "STEM"],
  },
  {
    id: "p5", author: SAMPLE_USERS[4],
    content: "Study tip that changed my GPA: Stop highlighting. Start teaching. Explain concepts to someone else (or to yourself out loud). Retention went from ~40% to ~85% for me.",
    likes: 3200, comments: 412, shares: 890, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    tags: ["StudyTips", "Academic", "Productivity"],
  },
  {
    id: "p6", author: SAMPLE_USERS[0],
    content: "Shoutout to the international student community at Stanford! The cultural fair last night was absolutely incredible. 40+ countries represented, amazing food, music, and people.",
    likes: 445, comments: 67, shares: 34, isLiked: false, isFollowing: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    tags: ["Stanford", "InternationalStudents", "CulturalFair"],
  },
];

const INITIAL_COMMENTS: Record<string, Comment[]> = {
  p1: [
    {
      id: "c1", author: SAMPLE_USERS[4],
      content: "This is incredible! Would love to see the methodology. Are you planning to publish?",
      likes: 12, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: "c2", author: SAMPLE_USERS[2],
      content: "89% accuracy is wild. What dataset did you use?",
      likes: 8, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    },
  ],
  p2: [
    {
      id: "c3", author: SAMPLE_USERS[0],
      content: "Absolutely deserved! You all were incredible out there.",
      likes: 45, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ],
  p5: [
    {
      id: "c4", author: SAMPLE_USERS[1],
      content: "The Feynman technique! Changed my study game completely.",
      likes: 234, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
    {
      id: "c5", author: SAMPLE_USERS[3],
      content: "This plus spaced repetition = unstoppable. Try Anki too.",
      likes: 178, isLiked: false, createdAt: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    },
  ],
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "like",
    actor: { name: "Priya Sharma", avatar: "https://i.pravatar.cc/150?img=5", username: "priya_s" },
    message: "liked your post",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "n2", type: "follow",
    actor: { name: "Marcus Williams", avatar: "https://i.pravatar.cc/150?img=12", username: "marcusw" },
    message: "started following you",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "n3", type: "comment",
    actor: { name: "Sofia Chen", avatar: "https://i.pravatar.cc/150?img=9", username: "sofiachen" },
    message: "commented on your post",
    isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "n4", type: "like",
    actor: { name: "James Okafor", avatar: "https://i.pravatar.cc/150?img=15", username: "jamesokafor" },
    message: "liked your post",
    isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "n5", type: "mention",
    actor: { name: "Aisha Rahman", avatar: "https://i.pravatar.cc/150?img=20", username: "aisharahman" },
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
