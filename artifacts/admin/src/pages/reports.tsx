import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "violence"
  | "nudity"
  | "self_harm"
  | "misinformation"
  | "other";

type TargetType = "post" | "comment" | "user" | "message";
type ReportStatus = "pending" | "reviewed" | "resolved";

interface Report {
  id: string;
  reporterId: string;
  reporterUsername?: string;
  targetType: TargetType;
  targetId: string;
  targetUserId?: string | null;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  createdAt: { seconds: number } | null;
  reviewedAt?: { seconds: number } | null;
  reviewerNote?: string;
}

interface Preview {
  authorName?: string;
  authorUsername?: string;
  content?: string;
  notFound?: boolean;
}

const REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment or bullying",
  hate_speech: "Hate speech",
  violence: "Violence or threats",
  nudity: "Nudity or sexual content",
  self_harm: "Self-harm",
  misinformation: "Misinformation",
  other: "Other",
};

const REASON_COLORS: Record<ReportReason, string> = {
  spam: "bg-yellow-500/15 text-yellow-700",
  harassment: "bg-orange-500/15 text-orange-700",
  hate_speech: "bg-red-500/15 text-red-700",
  violence: "bg-red-600/15 text-red-800",
  nudity: "bg-pink-500/15 text-pink-700",
  self_harm: "bg-purple-500/15 text-purple-700",
  misinformation: "bg-blue-500/15 text-blue-700",
  other: "bg-gray-500/15 text-gray-700",
};

function formatDate(ts: { seconds: number } | null | undefined) {
  if (!ts) return "—";
  return new Date(ts.seconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportStatus>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Counts across all statuses for the tab badges.
  const [counts, setCounts] = useState<Record<ReportStatus, number>>({
    pending: 0,
    reviewed: 0,
    resolved: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reports"), (snap) => {
      const next: Record<ReportStatus, number> = { pending: 0, reviewed: 0, resolved: 0 };
      snap.docs.forEach((d) => {
        const status = (d.data().status as ReportStatus) ?? "pending";
        if (next[status] != null) next[status] += 1;
      });
      setCounts(next);
    });
    return unsub;
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "reports"),
      where("status", "==", filter),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Report, "id">) }));
        setReports(list);
        setLoading(false);
      },
      (err) => {
        console.error("Reports load failed:", err);
        setLoading(false);
      }
    );
    return unsub;
  }, [filter]);

  // Fetch a small preview (author + content snippet) for each post-target report.
  async function loadPreview(report: Report) {
    if (previews[report.id]) return;
    if (report.targetType !== "post" && report.targetType !== "comment") {
      setPreviews((p) => ({ ...p, [report.id]: { notFound: true } }));
      return;
    }
    try {
      const ref =
        report.targetType === "post"
          ? doc(db, "posts", report.targetId)
          : null; // comment previews would need a parent post id; skipping for now
      if (!ref) {
        setPreviews((p) => ({ ...p, [report.id]: { notFound: true } }));
        return;
      }
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setPreviews((p) => ({ ...p, [report.id]: { notFound: true } }));
        return;
      }
      const data = snap.data();
      setPreviews((p) => ({
        ...p,
        [report.id]: {
          authorName: data.author?.name,
          authorUsername: data.author?.username,
          content: data.content,
        },
      }));
    } catch {
      setPreviews((p) => ({ ...p, [report.id]: { notFound: true } }));
    }
  }

  function toggleExpand(report: Report) {
    if (expandedId === report.id) {
      setExpandedId(null);
    } else {
      setExpandedId(report.id);
      void loadPreview(report);
    }
  }

  async function setStatus(report: Report, status: ReportStatus) {
    setActionLoading(report.id + status);
    try {
      await updateDoc(doc(db, "reports", report.id), {
        status,
        reviewedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Could not update report. Check your admin custom-claim and Firestore rules.");
    }
    setActionLoading(null);
  }

  async function removeReportedPost(report: Report) {
    if (report.targetType !== "post") {
      alert("Removing comments/messages from this UI is not supported yet.");
      return;
    }
    const ok = window.confirm(
      "Permanently delete the reported post? This cannot be undone. The report will then be marked Resolved."
    );
    if (!ok) return;
    setActionLoading(report.id + "remove");
    try {
      // Atomic: delete the post AND mark the report resolved in a single
      // batched write. Prevents an orphaned "pending" report pointing at a
      // deleted post if the second write fails.
      const batch = writeBatch(db);
      batch.delete(doc(db, "posts", report.targetId));
      batch.update(doc(db, "reports", report.id), {
        status: "resolved",
        reviewedAt: serverTimestamp(),
        reviewerNote: "Content removed by admin.",
      });
      await batch.commit();
    } catch (err) {
      console.error("Remove failed:", err);
      alert("Could not remove post. It may already be deleted.");
    }
    setActionLoading(null);
  }

  const tabs: { key: ReportStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "reviewed", label: "Reviewed" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShieldIcon size={28} />
          <h1 className="text-2xl font-bold text-foreground">Content Moderation</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          User-submitted reports of posts, comments, messages, and accounts. Required for App Store / Google Play review (Apple Guideline 1.2).
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              filter === t.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === t.key ? "bg-primary/15 text-primary" : "bg-muted-foreground/10"
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShieldIcon size={32} />
          </div>
          <p className="text-base font-medium text-foreground">No {filter} reports</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "pending"
              ? "All caught up — no reports waiting for review."
              : `No reports in the ${filter} state.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            const preview = previews[report.id];
            return (
              <div
                key={report.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Row */}
                <div className="p-4 flex items-start gap-4">
                  <div className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold ${REASON_COLORS[report.reason]}`}>
                    {REASON_LABELS[report.reason]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {report.targetType === "post"
                          ? "Post"
                          : report.targetType === "comment"
                          ? "Comment"
                          : report.targetType === "user"
                          ? "User"
                          : "Message"}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        Reported by{" "}
                        <span className="font-medium text-foreground">
                          @{report.reporterUsername ?? report.reporterId.slice(0, 8)}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</span>
                    </div>
                    {report.details && (
                      <p className="mt-1.5 text-sm text-foreground/80 line-clamp-2">
                        “{report.details}”
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground font-mono break-all">
                      target: {report.targetId}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(report)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                    >
                      {isExpanded ? "Hide" : "Inspect"}
                    </button>
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 px-4 py-4">
                    {report.targetType === "post" ? (
                      preview === undefined ? (
                        <p className="text-xs text-muted-foreground">Loading post…</p>
                      ) : preview.notFound ? (
                        <p className="text-xs text-muted-foreground italic">
                          The reported post no longer exists (already deleted).
                        </p>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Posted by{" "}
                            <span className="font-medium text-foreground">
                              {preview.authorName} (@{preview.authorUsername})
                            </span>
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap bg-background border border-border rounded-md p-3">
                            {preview.content || <em className="text-muted-foreground">(no text — media post)</em>}
                          </p>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Inline preview not available for {report.targetType} reports yet. Look up{" "}
                        <span className="font-mono">{report.targetId}</span> in Firestore directly.
                      </p>
                    )}

                    {/* Action row */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {filter === "pending" && (
                        <>
                          <button
                            onClick={() => setStatus(report, "reviewed")}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {actionLoading === report.id + "reviewed" ? "…" : "Mark reviewed"}
                          </button>
                          <button
                            onClick={() => setStatus(report, "resolved")}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {actionLoading === report.id + "resolved" ? "…" : "Dismiss (no action)"}
                          </button>
                        </>
                      )}
                      {filter === "reviewed" && (
                        <button
                          onClick={() => setStatus(report, "resolved")}
                          disabled={!!actionLoading}
                          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {actionLoading === report.id + "resolved" ? "…" : "Mark resolved"}
                        </button>
                      )}
                      {(filter === "pending" || filter === "reviewed") &&
                        report.targetType === "post" &&
                        preview &&
                        !preview.notFound && (
                          <button
                            onClick={() => removeReportedPost(report)}
                            disabled={!!actionLoading}
                            className="ml-auto px-3 py-1.5 text-sm font-semibold rounded-lg bg-destructive text-white hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === report.id + "remove" ? "Removing…" : "Remove content"}
                          </button>
                        )}
                      {filter === "resolved" && report.reviewerNote && (
                        <span className="text-xs text-muted-foreground italic">
                          {report.reviewerNote}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
