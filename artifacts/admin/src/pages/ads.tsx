import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type AdStatus = "pending" | "active" | "paused" | "rejected";
type AdBudget = "basic" | "standard" | "premium";
type AdAudience = "all" | "university" | "high_school";

interface Ad {
  id: string;
  ownerId: string;
  sponsorName: string;
  headline: string;
  body: string;
  cta: string;
  budget: AdBudget;
  audience: AdAudience;
  status: AdStatus;
  createdAt: string;
  impressions: number;
  clicks: number;
}

const BUDGET_LABELS: Record<AdBudget, string> = {
  basic: "Basic · L$500/day",
  standard: "Standard · L$1,500/day",
  premium: "Premium · L$3,000/day",
};

const AUDIENCE_LABELS: Record<AdAudience, string> = {
  all: "All Students",
  university: "University Only",
  high_school: "High School Only",
};

const STATUS_STYLES: Record<AdStatus, { dot: string; text: string; bg: string }> = {
  active: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  pending: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  paused: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100" },
  rejected: { dot: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
};

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AdStatus | "">("");
  const [search, setSearch] = useState("");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const next: Ad[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            ownerId: String(data.ownerId ?? ""),
            sponsorName: String(data.sponsorName ?? ""),
            headline: String(data.headline ?? ""),
            body: String(data.body ?? ""),
            cta: String(data.cta ?? "Learn More"),
            budget: (data.budget as AdBudget) ?? "basic",
            audience: (data.audience as AdAudience) ?? "all",
            status: (data.status as AdStatus) ?? "pending",
            createdAt: tsToIso(data.createdAt),
            impressions: Number(data.impressions ?? 0),
            clicks: Number(data.clicks ?? 0),
          };
        });
        setAds(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => ads.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.sponsorName.toLowerCase().includes(q) || a.headline.toLowerCase().includes(q);
    }
    return true;
  }), [ads, statusFilter, search]);

  const stats = useMemo(() => ({
    total: ads.length,
    active: ads.filter((a) => a.status === "active").length,
    pending: ads.filter((a) => a.status === "pending").length,
    impressions: ads.reduce((s, a) => s + a.impressions, 0),
  }), [ads]);

  async function setStatus(id: string, status: AdStatus) {
    setActionLoading(id + status);
    try {
      await updateDoc(doc(db, "ads", id), { status });
      setSelectedAd(null);
    } catch (err) {
      console.error("Ad status update failed:", err);
    }
    setActionLoading(null);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatNum(n: number) {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Ads Manager</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review, approve, and manage advertisements running on Palava Hub</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Ads", value: stats.total, icon: "📢" },
          { label: "Active", value: stats.active, icon: "✅" },
          { label: "Pending Review", value: stats.pending, icon: "⏳" },
          { label: "Total Impressions", value: formatNum(stats.impressions), icon: "👁️" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by sponsor or headline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdStatus | "")}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Pending banner */}
      {stats.pending > 0 && !statusFilter && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-amber-500 text-lg">⚠️</span>
          <p className="text-sm font-medium text-amber-800">
            {stats.pending} ad{stats.pending > 1 ? "s" : ""} waiting for your review
          </p>
          <button
            onClick={() => setStatusFilter("pending")}
            className="ml-auto text-xs font-semibold text-amber-700 hover:underline"
          >
            Review now →
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ad</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Audience</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Budget</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Performance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No ads found</td></tr>
            ) : (
              filtered.map((ad) => {
                const s = STATUS_STYLES[ad.status];
                return (
                  <tr key={ad.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-foreground truncate max-w-[180px]">{ad.headline}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ad.sponsorName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ad.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-foreground">{AUDIENCE_LABELS[ad.audience]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{BUDGET_LABELS[ad.budget]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-xs">
                        <span><span className="font-semibold text-foreground">{formatNum(ad.impressions)}</span> <span className="text-muted-foreground">views</span></span>
                        <span><span className="font-semibold text-foreground">{formatNum(ad.clicks)}</span> <span className="text-muted-foreground">clicks</span></span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {ad.status === "pending" && (
                          <>
                            <button
                              onClick={() => setStatus(ad.id, "active")}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === ad.id + "active" ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => setStatus(ad.id, "rejected")}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === ad.id + "rejected" ? "…" : "Reject"}
                            </button>
                          </>
                        )}
                        {ad.status === "active" && (
                          <button
                            onClick={() => setStatus(ad.id, "paused")}
                            disabled={!!actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            Pause
                          </button>
                        )}
                        {ad.status === "paused" && (
                          <button
                            onClick={() => setStatus(ad.id, "active")}
                            disabled={!!actionLoading}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedAd(ad)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Ad detail modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6" onClick={() => setSelectedAd(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{selectedAd.headline}</h2>
                <p className="text-sm text-muted-foreground">{selectedAd.sponsorName}</p>
              </div>
              <button onClick={() => setSelectedAd(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="rounded-xl bg-muted/40 p-4 text-sm text-foreground leading-relaxed">
              {selectedAd.body}
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground font-medium">CTA Button</p>
                <p className="font-semibold text-foreground mt-1">{selectedAd.cta}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground font-medium">Audience</p>
                <p className="font-semibold text-foreground mt-1">{AUDIENCE_LABELS[selectedAd.audience]}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground font-medium">Budget</p>
                <p className="font-semibold text-foreground mt-1">{BUDGET_LABELS[selectedAd.budget]}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground font-medium">Submitted</p>
                <p className="font-semibold text-foreground mt-1">{formatDate(selectedAd.createdAt)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selectedAd.status === "pending" && (
                <>
                  <button onClick={() => setStatus(selectedAd.id, "active")} className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                    ✓ Approve
                  </button>
                  <button onClick={() => setStatus(selectedAd.id, "rejected")} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
                    ✕ Reject
                  </button>
                </>
              )}
              {selectedAd.status === "active" && (
                <button onClick={() => setStatus(selectedAd.id, "paused")} className="flex-1 py-2.5 rounded-lg bg-slate-200 text-slate-800 text-sm font-semibold hover:bg-slate-300 transition-colors">
                  ⏸ Pause Ad
                </button>
              )}
              {selectedAd.status === "paused" && (
                <button onClick={() => setStatus(selectedAd.id, "active")} className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                  ▶ Resume Ad
                </button>
              )}
              <button onClick={() => setSelectedAd(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
