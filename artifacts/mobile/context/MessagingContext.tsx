import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

export function encryptMessage(text: string, _myId: string, _otherId: string): string {
  return text;
}

export function decryptMessage(cipher: string, _myId: string, _otherId: string): string {
  return cipher;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  encryptedText: string;
  createdAt: string;
  read: boolean;
  mediaUri?: string;
  mediaType?: "image" | "video" | "audio";
  audioDuration?: number;
}

export interface Conversation {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  school: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

function convId(a: string, b: string) {
  return [a, b].sort().join("_");
}

function tsToString(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  if (ts?.toDate) return ts.toDate().toISOString();
  return new Date().toISOString();
}

interface MessagingContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  totalUnread: number;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  sendMessage: (
    toUserId: string, toName: string, toUsername: string,
    toAvatar: string, toSchool: string, text: string,
    myId: string, myName: string, myUsername: string, myAvatar: string, mySchool: string,
    media?: { uri: string; type: "image" | "video" | "audio"; duration?: number }
  ) => Promise<void>;
  markRead: (userId: string) => void;
  getConversation: (userId: string) => Conversation | undefined;
  subscribeToConversation: (myId: string, otherId: string) => () => void;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Hide conversations and messages from any user the current user has
  // blocked. Required by Apple Guideline 1.2 — blocked users must not be
  // able to reach the blocker through any in-app channel.
  const { user: authUser } = useAuth();
  const blockedIds = authUser?.blockedUserIds ?? [];

  const conversations = React.useMemo(
    () => allConversations.filter((c) => !blockedIds.includes(c.userId)),
    [allConversations, blockedIds],
  );

  useEffect(() => {
    if (!currentUserId) return;

    const convRef = collection(db, "users", currentUserId, "conversations");
    const q = query(convRef, orderBy("lastAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const convs: Conversation[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          userId: d.id,
          name: data.name ?? "",
          username: data.username ?? "",
          avatar: data.avatar ?? "",
          school: data.school ?? "",
          lastMessage: data.lastMessage ?? "",
          lastAt: tsToString(data.lastAt),
          unread: data.unread ?? 0,
        };
      });
      setAllConversations(convs);
    });

    return unsub;
  }, [currentUserId]);

  const subscribeToConversation = useCallback((myId: string, otherId: string) => {
    if (blockedIds.includes(otherId)) {
      setMessages((prev) => ({ ...prev, [otherId]: [] }));
      return () => {};
    }
    const cid = convId(myId, otherId);
    const msgsRef = collection(db, "conversations", cid, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromId: data.fromId,
          toId: data.toId,
          text: data.text,
          encryptedText: data.text,
          createdAt: tsToString(data.createdAt),
          read: data.read ?? false,
          mediaUri: data.mediaUri,
          mediaType: data.mediaType,
          audioDuration: data.audioDuration,
        };
      });
      setMessages((prev) => ({ ...prev, [otherId]: msgs }));
    });

    return unsub;
  }, []);

  const sendMessage = useCallback(async (
    toUserId: string,
    toName: string,
    toUsername: string,
    toAvatar: string,
    toSchool: string,
    text: string,
    myId: string,
    myName: string,
    myUsername: string,
    myAvatar: string,
    mySchool: string,
    media?: { uri: string; type: "image" | "video" | "audio"; duration?: number }
  ) => {
    if (blockedIds.includes(toUserId)) {
      throw new Error("You have blocked this user. Unblock them to send a message.");
    }
    const cid = convId(myId, toUserId);
    const now = serverTimestamp();

    await addDoc(collection(db, "conversations", cid, "messages"), {
      fromId: myId,
      toId: toUserId,
      text,
      createdAt: now,
      read: false,
      mediaUri: media?.uri ?? null,
      mediaType: media?.type ?? null,
      audioDuration: media?.duration ?? null,
    });

    const lastMessagePreview = media
      ? media.type === "image" ? "📷 Photo" : media.type === "video" ? "🎥 Video" : "🎤 Voice message"
      : text;

    await setDoc(
      doc(db, "users", myId, "conversations", toUserId),
      { name: toName, username: toUsername, avatar: toAvatar, school: toSchool, lastMessage: lastMessagePreview, lastAt: now, unread: 0 },
      { merge: true }
    );

    await setDoc(
      doc(db, "users", toUserId, "conversations", myId),
      { name: myName, username: myUsername, avatar: myAvatar, school: mySchool, lastMessage: lastMessagePreview, lastAt: now, unread: 1 },
      { merge: true }
    );
  }, []);

  const markRead = useCallback((userId: string) => {
    if (!currentUserId) return;
    setAllConversations((prev) =>
      prev.map((c) => c.userId === userId ? { ...c, unread: 0 } : c)
    );
    updateDoc(
      doc(db, "users", currentUserId, "conversations", userId),
      { unread: 0 }
    ).catch(() => {});
  }, [currentUserId]);

  const getConversation = useCallback((userId: string) => {
    return conversations.find((c) => c.userId === userId);
  }, [conversations]);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        messages,
        totalUnread,
        currentUserId,
        setCurrentUserId,
        sendMessage,
        markRead,
        getConversation,
        subscribeToConversation,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
