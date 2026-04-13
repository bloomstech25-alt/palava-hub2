import React, { createContext, useContext, useState, useCallback } from "react";
import { SAMPLE_USERS } from "./FeedContext";

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
  read: boolean;
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
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  u2: [
    {
      id: "m1", fromId: "u2", toId: "me",
      text: "Hey! Did you see the tech fair announcement? Are you going?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: true,
    },
    {
      id: "m2", fromId: "me", toId: "u2",
      text: "Yes! I'm definitely going. I'm actually presenting my bus tracker app.",
      createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(), read: true,
    },
    {
      id: "m3", fromId: "u2", toId: "me",
      text: "That's so cool!! I'll make sure to come see your presentation 🙌",
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), read: false,
    },
  ],
  u3: [
    {
      id: "m4", fromId: "u3", toId: "me",
      text: "Did you finish the public health assignment?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: true,
    },
    {
      id: "m5", fromId: "me", toId: "u3",
      text: "Not yet 😅 I'm still working on the section about community outreach in Sinkor.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(), read: true,
    },
  ],
  u4: [
    {
      id: "m6", fromId: "u4", toId: "me",
      text: "That study tip you posted is a lifesaver fr 🔥",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: true,
    },
  ],
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    userId: "u2",
    name: "Fatima Kollie",
    username: "fatima_k",
    avatar: "https://i.pravatar.cc/150?img=5",
    school: "University of Liberia",
    lastMessage: "That's so cool!! I'll make sure to come see your presentation 🙌",
    lastAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    unread: 1,
  },
  {
    userId: "u3",
    name: "Emmanuel Flomo",
    username: "eflomo",
    avatar: "https://i.pravatar.cc/150?img=12",
    school: "Cuttington University",
    lastMessage: "Not yet 😅 I'm still working on the section about community outreach in Sinkor.",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 1.8).toISOString(),
    unread: 0,
  },
  {
    userId: "u4",
    name: "Mary Sumo",
    username: "marysumo",
    avatar: "https://i.pravatar.cc/150?img=9",
    school: "United Methodist University",
    lastMessage: "That study tip you posted is a lifesaver fr 🔥",
    lastAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    unread: 0,
  },
];

interface MessagingContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  totalUnread: number;
  sendMessage: (toUserId: string, toName: string, toUsername: string, toAvatar: string, toSchool: string, text: string, myId: string) => void;
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
    text: string, myId: string
  ) => {
    const newMsg: Message = {
      id: "msg_" + Date.now() + Math.random().toString(36).substr(2, 5),
      fromId: myId,
      toId: toUserId,
      text,
      createdAt: new Date().toISOString(),
      read: true,
    };

    setMessages((prev) => ({
      ...prev,
      [toUserId]: [...(prev[toUserId] ?? []), newMsg],
    }));

    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === toUserId);
      const updated = existing
        ? prev.map((c) => c.userId === toUserId ? { ...c, lastMessage: text, lastAt: newMsg.createdAt, unread: 0 } : c)
        : [
            {
              userId: toUserId, name: toName, username: toUsername,
              avatar: toAvatar, school: toSchool,
              lastMessage: text, lastAt: newMsg.createdAt, unread: 0,
            },
            ...prev,
          ];
      return updated.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
    });

    // Simulate auto-reply after 1.5-3s
    const delay = 1500 + Math.random() * 1500;
    setTimeout(() => {
      const reply: Message = {
        id: "msg_" + Date.now() + Math.random().toString(36).substr(2, 5),
        fromId: toUserId,
        toId: myId,
        text: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
        createdAt: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => ({
        ...prev,
        [toUserId]: [...(prev[toUserId] ?? []), reply],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === toUserId
            ? { ...c, lastMessage: reply.text, lastAt: reply.createdAt, unread: c.unread + 1 }
            : c
        )
      );
    }, delay);
  }, []);

  const markRead = useCallback((userId: string) => {
    setMessages((prev) => ({
      ...prev,
      [userId]: (prev[userId] ?? []).map((m) => ({ ...m, read: true })),
    }));
    setConversations((prev) =>
      prev.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c))
    );
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
