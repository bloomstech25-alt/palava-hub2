import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VerificationRequest {
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userSchool: string;
  followers: number;
  appliedAt: { seconds: number } | null;
  status: "pending" | "approved" | "rejected";
}

function PalavaStarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5.5V12c0 4.8 3.5 9.1 8 10.5C16.5 21.1 20 16.8 20 12V5.5L12 2z" fill="#BF0A30" />
      <circle cx="12" cy="3.5" r="1" fill="#D4A855" />
      <polygon points="12,7 13.1,10.3 16.5,10.3 13.9,12.3 14.9,15.5 12,13.5 9.1,15.5 10.1,12.3 7.5,10.3 10.9,10.3" fill="#D4A855" />
    </svg>
  );
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(ts: { seconds: number } | null) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function VerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "verificationRequests"),
      where("status", "==", filter),
      orderBy("appliedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ ...(d.data() as VerificationRequest), userId: d.id })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [filter]);

  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setActionLoading(userId + decision);
    try {
      await updateDoc(doc(db, "verificationRequests", userId), {
        status: decision,
        reviewedAt: new Date(),
      });
      await updateDoc(doc(db, "users", userId), {
        verificationStatus: decision,
      });
    } catch (err) {
      console.error("Decision failed:", err);
    }
    setActionLoading(null);
  }

  const tabs: { key: "pending" | "approved" | "rejected"; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <PalavaStarIcon size={28} />
          <h1 className="text-2xl font-bold text-foreground">Palava Star Verification</h1>
        </div>
        <p className="text-sm text-muted-foreground">Review and approve verification badge applications from users with 50+ followers.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <PalavaStarIcon size={32} />
          </div>
          <p className="text-base font-medium text-foreground">No {filter} applications</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "pending" ? "All caught up — no applications waiting for review." : `No ${filter} applications yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.userId}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
            >
              {/* Avatar */}
              {req.userAvatar ? (
                <img
                  src={req.userAvatar}
                  alt={req.userName}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{getInitials(req.userName)}</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">{req.userName}</span>
                  {req.status === "approved" && <PalavaStarIcon size={16} />}
                </div>
                <p className="text-sm text-muted-foreground">@{req.userUsername} · {req.userSchool}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{req.followers.toLocaleString()}</span> followers
                  </span>
                  <span className="text-xs text-muted-foreground">Applied {formatDate(req.appliedAt)}</span>
                </div>
              </div>

              {/* Status badge + Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {filter === "pending" ? (
                  <>
                    <button
                      onClick={() => handleDecision(req.userId, "rejected")}
                      disabled={!!actionLoading}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === req.userId + "rejected" ? "…" : "Reject"}
                    </button>
                    <button
                      onClick={() => handleDecision(req.userId, "approved")}
                      disabled={!!actionLoading}
                      className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {actionLoading === req.userId + "approved" ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <PalawaStarInline />
                          Approve
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    filter === "approved"
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-red-500/10 text-red-500"
                  }`}>
                    {filter === "approved" ? "✓ Approved" : "✗ Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PalawaStarInline() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5.5V12c0 4.8 3.5 9.1 8 10.5C16.5 21.1 20 16.8 20 12V5.5L12 2z" fill="white" fillOpacity="0.9" />
      <polygon points="12,7 13.1,10.3 16.5,10.3 13.9,12.3 14.9,15.5 12,13.5 9.1,15.5 10.1,12.3 7.5,10.3 10.9,10.3" fill="#D4A855" />
    </svg>
  );
}
