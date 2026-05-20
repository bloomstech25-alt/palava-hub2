import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Flame, Loader2, X } from "lucide-react";
import { timeAgo } from "@/lib/utils";

type Palava = {
  id: string;
  // `text` is the canonical field used by the mobile app. We also read
  // legacy `content` as a fallback for any older docs that might exist.
  text?: string;
  content?: string;
  schoolName?: string;
  schoolType?: "university" | "high_school";
  createdAt?: { seconds: number };
  reactions?: { wahala?: number; funny?: number; realTalk?: number; spill?: number };
  wahalaBy?: string[];
  funnyBy?: string[];
  realTalkBy?: string[];
  spillBy?: string[];
};

const PROMPTS = [
  "Tell me something you've never told anyone…",
  "What's the wildest thing you've seen on campus?",
  "Hot take: who really runs your school?",
  "Confess one thing you did last semester.",
  "What's a Liberian myth you secretly believe?",
];

const REACTIONS = [
  { key: "wahala", label: "Wahala", emoji: "😱", arrayField: "wahalaBy", countField: "wahala" },
  { key: "funny", label: "Funny", emoji: "😂", arrayField: "funnyBy", countField: "funny" },
  { key: "realTalk", label: "Real Talk", emoji: "🙏", arrayField: "realTalkBy", countField: "realTalk" },
  { key: "spill", label: "Spill More", emoji: "🍵", arrayField: "spillBy", countField: "spill" },
] as const;

export default function PalavaRoom() {
  const { profile } = useAuth();
  const [palavas, setPalavas] = useState<Palava[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    const qq = query(
      collection(db, "palavaroomPosts"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(
      qq,
      (snap) => {
        const now = Date.now();
        const items: Palava[] = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Palava, "id">) }))
          .filter((p) => {
            const ms = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : 0;
            if (!ms) return true;
            return now - ms < 24 * 60 * 60 * 1000;
          });
        setPalavas(items);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  async function react(p: Palava, r: (typeof REACTIONS)[number]) {
    if (!profile) return;
    const arr = (p[r.arrayField as keyof Palava] as string[]) ?? [];
    const alreadyReacted = arr.includes(profile.id);
    try {
      await updateDoc(doc(db, "palavaroomPosts", p.id), {
        [r.arrayField]: alreadyReacted
          ? arrayRemove(profile.id)
          : arrayUnion(profile.id),
        [`reactions.${r.countField}`]: increment(alreadyReacted ? -1 : 1),
      });
    } catch {
      /* ignore — rules will reject if user already reacted */
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-palava-red/10 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-palava-red" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg">Palava Room 🔥</h1>
          <p className="text-sm text-fb-text-secondary">
            Anonymous campus confessions. Posts auto-delete in 24h. Only your
            school name is shown — never your identity.
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="bg-palava-red hover:bg-palava-red-dark text-white font-semibold px-4 py-2 rounded-lg text-sm shrink-0"
        >
          Spill
        </button>
      </div>

      {loading && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          Loading palavas…
        </div>
      )}
      {!loading && palavas.length === 0 && (
        <div className="bg-fb-card rounded-xl p-10 text-center text-fb-text-secondary">
          No palavas yet. Be the first to spill!
        </div>
      )}
      {palavas.map((p) => (
        <article
          key={p.id}
          className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4"
        >
          <div className="text-xs text-fb-text-secondary mb-2 flex items-center gap-2">
            <Flame className="w-3 h-3 text-palava-red" />
            <span>Anonymous</span>
            {p.schoolName && (
              <>
                <span>·</span>
                <span className="truncate">{p.schoolName}</span>
              </>
            )}
            <span>·</span>
            <span>{timeAgo(p.createdAt)}</span>
          </div>
          <p className="text-[15px] whitespace-pre-wrap break-words mb-3">
            {p.text ?? p.content ?? ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {REACTIONS.map((r) => {
              const arr = (p[r.arrayField as keyof Palava] as string[]) ?? [];
              const mine = !!profile && arr.includes(profile.id);
              const count = (p.reactions?.[r.countField] as number) ?? 0;
              return (
                <button
                  key={r.key}
                  onClick={() => void react(p, r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    mine
                      ? "bg-palava-red/10 border-palava-red text-palava-red"
                      : "bg-fb-bg border-fb-border hover:bg-fb-hover"
                  }`}
                >
                  <span className="mr-1">{r.emoji}</span>
                  {r.label}
                  {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
                </button>
              );
            })}
          </div>
        </article>
      ))}

      {showCompose && (
        <ComposePalava
          onClose={() => setShowCompose(false)}
          schoolName={profile?.school?.name}
          schoolType={
            profile?.school?.type === "high_school" ? "high_school" : "university"
          }
        />
      )}
    </div>
  );
}

function ComposePalava({
  onClose,
  schoolName,
  schoolType,
}: {
  onClose: () => void;
  schoolName?: string;
  schoolType: "university" | "high_school";
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prompt = useMemo(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
    [],
  );

  async function submit() {
    const t = text.trim();
    if (t.length < 10) {
      setError("Palava must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addDoc(collection(db, "palavaroomPosts"), {
        text: t,
        schoolName: schoolName ?? null,
        schoolType,
        createdAt: serverTimestamp(),
        reactions: { wahala: 0, funny: 0, realTalk: 0, spill: 0 },
        wahalaBy: [],
        funnyBy: [],
        realTalkBy: [],
        spillBy: [],
      });
      onClose();
    } catch (e) {
      setError((e as Error).message ?? "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-fb-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-fb-border">
          <h2 className="font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-palava-red" /> Spill a palava
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-fb-hover"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 300))}
            placeholder={prompt}
            rows={5}
            className="w-full resize-none bg-fb-bg rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-palava-red/40"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-fb-text-secondary">
            <span>100% anonymous · {schoolName ?? "no school set"}</span>
            <span>{text.length}/300</span>
          </div>
          {error && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-fb-border flex justify-end">
          <button
            onClick={submit}
            disabled={busy || text.trim().length < 10}
            className="bg-palava-red hover:bg-palava-red-dark text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Spilling…" : "Spill it"}
          </button>
        </div>
      </div>
    </div>
  );
}
