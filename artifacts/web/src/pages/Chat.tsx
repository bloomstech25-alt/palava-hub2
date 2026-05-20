import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
  useMessaging,
  type Message,
  isMutualFollow,
} from "@/context/MessagingContext";
import { useAuth, type UserProfile } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Send,
} from "lucide-react";

export default function Chat({ otherUserId }: { otherUserId: string }) {
  const { profile } = useAuth();
  const { subscribeToConversation, sendMessage, markRead, conversations } =
    useMessaging();
  const [other, setOther] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canChat, setCanChat] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", otherUserId));
        if (cancelled) return;
        if (snap.exists()) {
          setOther({
            id: snap.id,
            ...(snap.data() as Omit<UserProfile, "id">),
          });
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [otherUserId]);

  useEffect(() => {
    if (!profile) return;
    const unsub = subscribeToConversation(otherUserId, (msgs) => {
      setMessages(msgs);
    });
    void markRead(otherUserId);
    return () => unsub();
  }, [profile, otherUserId, subscribeToConversation, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!profile) return;
    const hasExisting = conversations.some((c) => c.userId === otherUserId);
    if (hasExisting) {
      setCanChat(true);
      return;
    }
    let cancelled = false;
    (async () => {
      const ok = await isMutualFollow(profile.id, otherUserId);
      if (!cancelled) setCanChat(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, otherUserId, conversations]);

  async function send() {
    if (!profile || !other) return;
    if (!text.trim() && !file) return;
    setBusy(true);
    setError(null);
    const t = text;
    const f = file;
    setText("");
    setFile(null);
    try {
      let media: { uri: string; type: "image" | "video" | "audio" } | undefined;
      if (f) {
        const ext = f.name.split(".").pop() ?? "bin";
        const path = `chats/${profile.id}/${Date.now()}.${ext}`;
        const r = ref(storage, path);
        await uploadBytes(r, f);
        const uri = await getDownloadURL(r);
        media = {
          uri,
          type: f.type.startsWith("video/")
            ? "video"
            : f.type.startsWith("audio/")
              ? "audio"
              : "image",
        };
      }
      await sendMessage(
        {
          id: other.id,
          name: other.name,
          username: other.username,
          avatar: other.avatar,
          school: other.school?.name,
        },
        t,
        media,
      );
    } catch (e) {
      setError((e as Error).message ?? "Failed to send");
      setText(t);
      setFile(f);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border flex flex-col h-[calc(100vh-6rem)]">
      <header className="p-3 border-b border-fb-border flex items-center gap-3">
        <Link
          href="/messages"
          className="p-2 rounded-full hover:bg-fb-hover"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        {other && (
          <Link
            href={`/profile/${other.id}`}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80"
          >
            <Avatar name={other.name} src={other.avatar} size={40} />
            <div className="min-w-0">
              <div className="font-semibold truncate">{other.name}</div>
              <div className="text-xs text-fb-text-secondary truncate">
                @{other.username}
              </div>
            </div>
          </Link>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-fb-bg">
        {messages.length === 0 && (
          <div className="text-center text-sm text-fb-text-secondary py-10">
            No messages yet. Say hi 👋
          </div>
        )}
        {messages.map((m) => {
          const mine = m.fromId === profile?.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-[15px] ${
                  mine
                    ? "bg-palava-red text-white rounded-br-md"
                    : "bg-fb-card text-fb-text border border-fb-border rounded-bl-md"
                }`}
              >
                {m.mediaUri && m.mediaType === "image" && (
                  <img
                    src={m.mediaUri}
                    alt=""
                    className="rounded-lg max-w-full max-h-[400px] mb-1"
                  />
                )}
                {m.mediaUri && m.mediaType === "video" && (
                  <video
                    src={m.mediaUri}
                    controls
                    className="rounded-lg max-w-full max-h-[400px] mb-1"
                  />
                )}
                {m.mediaUri && m.mediaType === "audio" && (
                  <audio src={m.mediaUri} controls className="w-full mb-1" />
                )}
                {m.text && (
                  <div className="whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {canChat === false && (
        <div className="px-4 py-3 text-xs text-amber-800 bg-amber-50 border-t border-amber-200">
          You and @{other?.username ?? "this user"} must follow each other
          before you can start a new conversation.
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}
      {file && (
        <div className="px-4 py-2 text-xs flex items-center justify-between border-t border-fb-border">
          <span className="truncate">📎 {file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-palava-red hover:underline ml-2 shrink-0"
          >
            Remove
          </button>
        </div>
      )}
      <div className="p-3 border-t border-fb-border flex items-end gap-2">
        <label className="p-2 rounded-full hover:bg-fb-hover cursor-pointer">
          <ImageIcon className="w-5 h-5 text-fb-text-secondary" />
          <input
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={
            canChat === false
              ? "Waiting for mutual follow…"
              : "Write a message…"
          }
          disabled={canChat === false}
          rows={1}
          className="flex-1 resize-none bg-fb-bg rounded-2xl px-4 py-2 text-[15px] outline-none focus:ring-2 focus:ring-palava-red/40 max-h-32 disabled:opacity-60"
        />
        <button
          onClick={send}
          disabled={busy || canChat === false || (!text.trim() && !file)}
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
    </div>
  );
}
