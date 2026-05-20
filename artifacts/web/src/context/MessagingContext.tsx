import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

export type Message = {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: string;
  read: boolean;
  mediaUri?: string | null;
  mediaType?: "image" | "video" | "audio" | null;
};

export type Conversation = {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  school: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export function convId(a: string, b: string) {
  return [a, b].sort().join("_");
}

function tsToString(ts: unknown): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "string") return ts;
  const t = ts as { toDate?: () => Date };
  if (typeof t.toDate === "function") return t.toDate().toISOString();
  return new Date().toISOString();
}

type Ctx = {
  conversations: Conversation[];
  totalUnread: number;
  subscribeToConversation: (
    otherId: string,
    onMessages: (msgs: Message[]) => void,
  ) => () => void;
  sendMessage: (
    other: {
      id: string;
      name: string;
      username: string;
      avatar?: string;
      school?: string;
    },
    text: string,
    media?: { uri: string; type: "image" | "video" | "audio" },
  ) => Promise<void>;
  markRead: (otherId: string) => Promise<void>;
};

const MessagingContext = createContext<Ctx | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const myId = profile?.id ?? null;
  const blocked = profile?.blockedUserIds ?? [];
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!myId) {
      setAllConversations([]);
      return;
    }
    const qq = query(
      collection(db, "users", myId, "conversations"),
      orderBy("lastAt", "desc"),
    );
    const unsub = onSnapshot(qq, (snap) => {
      const list: Conversation[] = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const rawSchool = data.school;
        const schoolStr =
          typeof rawSchool === "string"
            ? rawSchool
            : rawSchool && typeof rawSchool === "object" &&
                typeof (rawSchool as { name?: unknown }).name === "string"
              ? ((rawSchool as { name: string }).name)
              : "";
        return {
          userId: d.id,
          name: typeof data.name === "string" ? data.name : "",
          username: typeof data.username === "string" ? data.username : "",
          avatar: typeof data.avatar === "string" ? data.avatar : "",
          school: schoolStr,
          lastMessage:
            typeof data.lastMessage === "string" ? data.lastMessage : "",
          lastAt: tsToString(data.lastAt),
          unread: typeof data.unread === "number" ? data.unread : 0,
        };
      });
      setAllConversations(list);
    });
    return () => unsub();
  }, [myId]);

  const conversations = useMemo(
    () => allConversations.filter((c) => !blocked.includes(c.userId)),
    [allConversations, blocked],
  );

  const subscribeToConversation = useCallback(
    (otherId: string, onMessages: (msgs: Message[]) => void) => {
      if (!myId) return () => {};
      if (blocked.includes(otherId)) {
        onMessages([]);
        return () => {};
      }
      const cid = convId(myId, otherId);
      const qq = query(
        collection(db, "conversations", cid, "messages"),
        orderBy("createdAt", "asc"),
      );
      const unsub = onSnapshot(qq, (snap) => {
        const list: Message[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            fromId: String(data.fromId ?? ""),
            toId: String(data.toId ?? ""),
            text: typeof data.text === "string" ? data.text : "",
            createdAt: tsToString(data.createdAt),
            read: Boolean(data.read),
            mediaUri: (data.mediaUri as string | null) ?? null,
            mediaType: (data.mediaType as Message["mediaType"]) ?? null,
          };
        });
        onMessages(list);
      });
      return () => unsub();
    },
    [myId, blocked],
  );

  const sendMessage = useCallback(
    async (
      other: {
        id: string;
        name: string;
        username: string;
        avatar?: string;
        school?: string;
      },
      text: string,
      media?: { uri: string; type: "image" | "video" | "audio" },
    ) => {
      if (!myId || !profile) throw new Error("Not signed in");
      if (blocked.includes(other.id)) {
        throw new Error("You have blocked this user. Unblock to send.");
      }
      if (!text.trim() && !media) return;
      const cid = convId(myId, other.id);
      const now = serverTimestamp();
      await addDoc(collection(db, "conversations", cid, "messages"), {
        fromId: myId,
        toId: other.id,
        text: text.trim(),
        createdAt: now,
        read: false,
        mediaUri: media?.uri ?? null,
        mediaType: media?.type ?? null,
      });
      const preview = media
        ? media.type === "image"
          ? "📷 Photo"
          : media.type === "video"
            ? "🎥 Video"
            : "🎤 Voice message"
        : text.trim();
      await Promise.all([
        setDoc(
          doc(db, "users", myId, "conversations", other.id),
          {
            name: other.name,
            username: other.username,
            avatar: other.avatar ?? "",
            school: other.school ?? "",
            lastMessage: preview,
            lastAt: now,
            unread: 0,
          },
          { merge: true },
        ),
        setDoc(
          doc(db, "users", other.id, "conversations", myId),
          {
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar ?? "",
            school: profile.school?.name ?? "",
            lastMessage: preview,
            lastAt: now,
            unread: 1,
          },
          { merge: true },
        ),
      ]);
    },
    [myId, blocked, profile],
  );

  const markRead = useCallback(
    async (otherId: string) => {
      if (!myId) return;
      try {
        await updateDoc(
          doc(db, "users", myId, "conversations", otherId),
          { unread: 0 },
        );
      } catch {
        /* ignore */
      }
    },
    [myId],
  );

  const totalUnread = conversations.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        totalUnread,
        subscribeToConversation,
        sendMessage,
        markRead,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used inside MessagingProvider");
  return ctx;
}

export async function isMutualFollow(myId: string, otherId: string): Promise<boolean> {
  try {
    const [me, them] = await Promise.all([
      getDoc(doc(db, "users", myId)),
      getDoc(doc(db, "users", otherId)),
    ]);
    if (!me.exists() || !them.exists()) return false;
    const myFollowing: string[] = (me.data().followingIds as string[]) ?? [];
    const theirFollowing: string[] = (them.data().followingIds as string[]) ?? [];
    return myFollowing.includes(otherId) && theirFollowing.includes(myId);
  } catch {
    return false;
  }
}
