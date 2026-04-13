import React, { createContext, useContext, useState, useCallback } from "react";
import { SAMPLE_USERS } from "./FeedContext";

// --- Simple XOR encryption for E2E simulation ---
function deriveKey(userId1: string, userId2: string): number[] {
  const seed = [userId1, userId2].sort().join("|");
  const key: number[] = [];
  for (let i = 0; i < 32; i++) {
    key.push(seed.charCodeAt(i % seed.length) ^ (i * 7 + 13));
  }
  return key;
}

export function encryptMessage(text: string, myId: string, otherId: string): string {
  const key = deriveKey(myId, otherId);
  const bytes = Array.from(new TextEncoder().encode(text));
  const encrypted = bytes.map((b, i) => b ^ key[i % key.length]);
  return btoa(String.fromCharCode(...encrypted));
}

export function decryptMessage(cipher: string, myId: string, otherId: string): string {
  try {
    const key = deriveKey(myId, otherId);
    const bytes = Array.from(atob(cipher)).map((c) => c.charCodeAt(0));
    const decrypted = bytes.map((b, i) => b ^ key[i % key.length]);
    return new TextDecoder().decode(new Uint8Array(decrypted));
  } catch {
    return "[encrypted message]";
  }
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

const AUTO_REPLIES: string[] = [
  "That sounds great! 🙌",
  "Yeah, I totally agree!",
  "Haha, for real though 😄",
  "Let me check and get back to you.",
  "Yep, heard you! When do you want to connect?",
  "Nice! Thanks for reaching out 🇱🇷",
  "Sure, we should link up soon!",
  "Ohh interesting, tell me more!",
  "100%! Let's make it happen.",
  "My classes are so busy right now 😅 but I'll manage!",
  "That picture you sent is fire 🔥",
  "Wait, is that at campus?",
];

function makeMsg(fromId: string, toId: string, text: string, minsAgo: number, id: string): Message {
  return {
    id, fromId, toId, text,
    encryptedText: encryptMessage(text, fromId, toId),
    createdAt: new Date(Date.now() - 1000 * 60 * minsAgo).toISOString(),
    read: true,
  };
}

const INITIAL_MESSAGES: Record<string, Message[]> = {
  u2: [
    makeMsg("u2", "me", "Hey! Did you see the tech fair announcement? Are you going?", 30, "m1"),
    makeMsg("me", "u2", "Yes! I'm definitely going. I'm actually presenting my bus tracker app.", 28, "m2"),
    makeMsg("u2", "me", "That's so cool!! I'll make sure to come see your presentation 🙌", 25, "m3"),
  ],
  u3: [
    makeMsg("u3", "me", "Did you finish the public health assignment?", 120, "m4"),
    makeMsg("me", "u3", "Not yet 😅 I'm still working on the section about community outreach in Sinkor.", 108, "m5"),
  ],
  u4: [
    makeMsg("u4", "me", "That study tip you posted is a lifesaver fr 🔥", 300, "m6"),
  ],
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    userId: "u2", name: "Fatima Kollie", username: "fatima_k",
    avatar: "https://i.pravatar.cc/150?img=5", school: "University of Liberia",
    lastMessage: "That's so cool!! I'll make sure to come see your presentation 🙌",
    lastAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), unread: 1,
  },
  {
    userId: "u3", name: "Emmanuel Flomo", username: "eflomo",
    avatar: "https://i.pravatar.cc/150?img=12", school: "Cuttington University",
    lastMessage: "Not yet 😅 I'm still working on the section about community outreach in Sinkor.",
    lastAt: new Date(Date.now() - 1000 * 60 * 108).toISOString(), unread: 0,
  },
  {
    userId: "u4", name: "Mary Sumo", username: "marysumo",
    avatar: "https://i.pravatar.cc/150?img=9", school: "United Methodist University",
    lastMessage: "That study tip you posted is a lifesaver fr 🔥",
    lastAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(), unread: 0,
  },
];

interface MessagingContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  totalUnread: number;
  sendMessage: (
    toUserId: string, toName: string, toUsername: string,
    toAvatar: string, toSchool: string, text: string, myId: string,
    media?: { uri: string; type: "image" | "video" | "audio"; duration?: number }
  ) => void;
  markRead: (userId: string) => void;
  getConversation: (userId: string) => Conversation | undefined;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  const sendMessage = useCallback((
    toUserId: string, toName: string, toUsername: string, toAvatar: string, toSchool: string,
    text: string, myId: string,
    media?: { uri: string; type: "image" | "video" | "audio"; duration?: number }
  ) => {
    const displayText = media
      ? media.type === "image" ? "📷 Photo" : media.type === "video" ? "🎥 Video" : `🎙️ Voice (${media.duration ?? 0}s)`
      : text;

    const newMsg: Message = {
      id: "msg_" + Date.now() + Math.random().toString(36).substr(2, 5),
      fromId: myId,
      toId: toUserId,
      text: media ? displayText : text,
      encryptedText: encryptMessage(media ? displayText : text, myId, toUserId),
      createdAt: new Date().toISOString(),
      read: true,
      mediaUri: media?.uri,
      mediaType: media?.type,
      audioDuration: media?.duration,
    };

    setMessages((prev) => ({
      ...prev,
      [toUserId]: [...(prev[toUserId] ?? []), newMsg],
    }));

    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === toUserId);
      const updated = existing
        ? prev.map((c) => c.userId === toUserId ? { ...c, lastMessage: displayText, lastAt: newMsg.createdAt, unread: 0 } : c)
        : [{ userId: toUserId, name: toName, username: toUsername, avatar: toAvatar, school: toSchool, lastMessage: displayText, lastAt: newMsg.createdAt, unread: 0 }, ...prev];
      return updated.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
    });

    // Auto-reply (not for media-only, do it with delay)
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const reply: Message = {
        id: "msg_" + Date.now() + Math.random().toString(36).substr(2, 5),
        fromId: toUserId, toId: myId, text: replyText,
        encryptedText: encryptMessage(replyText, toUserId, myId),
        createdAt: new Date().toISOString(), read: false,
      };
      setMessages((prev) => ({ ...prev, [toUserId]: [...(prev[toUserId] ?? []), reply] }));
      setConversations((prev) =>
        prev.map((c) => c.userId === toUserId
          ? { ...c, lastMessage: replyText, lastAt: reply.createdAt, unread: c.unread + 1 }
          : c)
      );
    }, delay);
  }, []);

  const markRead = useCallback((userId: string) => {
    setMessages((prev) => ({ ...prev, [userId]: (prev[userId] ?? []).map((m) => ({ ...m, read: true })) }));
    setConversations((prev) => prev.map((c) => c.userId === userId ? { ...c, unread: 0 } : c));
  }, []);

  const getConversation = useCallback((userId: string) => {
    return conversations.find((c) => c.userId === userId);
  }, [conversations]);

  return (
    <MessagingContext.Provider value={{ conversations, messages, totalUnread, sendMessage, markRead, getConversation }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
