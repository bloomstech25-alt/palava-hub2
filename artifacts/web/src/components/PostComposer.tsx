import { useState } from "react";
import { Image as ImageIcon, Smile, Video, Loader2 } from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { Avatar } from "./Avatar";

export function PostComposer() {
  const { profile } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!profile) return;
    const text = content.trim();
    if (!text && !file) return;
    setBusy(true);
    setError(null);
    try {
      let mediaUri: string | undefined;
      let mediaType: "image" | "video" | undefined;
      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `posts/${profile.id}/${Date.now()}.${ext}`;
        const r = ref(storage, path);
        await uploadBytes(r, file);
        mediaUri = await getDownloadURL(r);
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      }
      const tags = (text.match(/#\w+/g) ?? []).map((t) =>
        t.slice(1).toLowerCase(),
      );
      const author = {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatar: profile.avatar ?? null,
        school: profile.school ?? null,
        isVerified: profile.isVerified ?? false,
      };
      await Promise.all([
        addDoc(collection(db, "posts"), {
          author,
          authorId: profile.id,
          content: text,
          mediaUri: mediaUri ?? null,
          mediaType: mediaType ?? null,
          category: "general",
          likes: 0,
          likedBy: [],
          comments: 0,
          shares: 0,
          repostedBy: [],
          isPinned: false,
          isFlagged: false,
          tags,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", profile.id), { posts: increment(1) }).catch(
          () => undefined,
        ),
      ]);
      setContent("");
      setFile(null);
    } catch (e) {
      setError((e as Error).message ?? "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4">
      <div className="flex items-start gap-3">
        <Avatar name={profile?.name ?? "?"} src={profile?.avatar} size={40} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${profile?.name?.split(" ")[0] ?? "friend"}?`}
          rows={file ? 2 : 3}
          className="flex-1 resize-none bg-fb-bg rounded-2xl px-4 py-3 text-[15px] placeholder:text-fb-text-secondary focus:outline-none focus:ring-2 focus:ring-fb-blue/40"
        />
      </div>
      {file && (
        <div className="mt-3 px-3 py-2 bg-fb-bg rounded-lg flex items-center justify-between text-sm">
          <span className="truncate">📎 {file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-fb-blue hover:underline shrink-0 ml-2"
          >
            Remove
          </button>
        </div>
      )}
      {error && (
        <div className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-fb-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-fb-hover cursor-pointer text-sm">
            <ImageIcon className="w-5 h-5 text-green-500" />
            <span className="hidden sm:inline font-medium text-fb-text-secondary">
              Photo
            </span>
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-fb-hover cursor-pointer text-sm">
            <Video className="w-5 h-5 text-red-500" />
            <span className="hidden sm:inline font-medium text-fb-text-secondary">
              Video
            </span>
            <input
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-fb-hover text-sm">
            <Smile className="w-5 h-5 text-yellow-500" />
            <span className="hidden sm:inline font-medium text-fb-text-secondary">
              Feeling
            </span>
          </button>
        </div>
        <button
          onClick={submit}
          disabled={busy || (!content.trim() && !file)}
          className="bg-fb-blue hover:bg-fb-blue-hover text-white font-bold px-5 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
