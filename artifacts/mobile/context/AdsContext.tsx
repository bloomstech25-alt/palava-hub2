import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AdStatus = "pending" | "active" | "paused" | "rejected";
export type AdCTA = "Learn More" | "Apply Now" | "Contact Us" | "Visit Website" | "Enroll Now";
export type AdBudget = "basic" | "standard" | "premium";
export type AdAudience = "all" | "university" | "high_school";

export interface Ad {
  id: string;
  ownerId: string;
  sponsorName: string;
  headline: string;
  body: string;
  cta: AdCTA;
  budget: AdBudget;
  audience: AdAudience;
  status: AdStatus;
  createdAt: string;
  impressions: number;
  clicks: number;
}

const BUDGET_LABELS: Record<AdBudget, string> = {
  basic: "Basic — L$500/day",
  standard: "Standard — L$1,500/day",
  premium: "Premium — L$3,000/day",
};

const AUDIENCE_LABELS: Record<AdAudience, string> = {
  all: "All Students",
  university: "University Students Only",
  high_school: "High School Students Only",
};

interface AdsContextType {
  ads: Ad[];
  myAds: (ownerId: string) => Ad[];
  createAd: (ownerId: string, data: Omit<Ad, "id" | "ownerId" | "createdAt" | "impressions" | "clicks" | "status">) => Promise<void>;
  pauseAd: (id: string) => Promise<void>;
  resumeAd: (id: string) => Promise<void>;
  trackImpression: (id: string) => void;
  trackClick: (id: string) => void;
  getActiveAds: () => Ad[];
  BUDGET_LABELS: typeof BUDGET_LABELS;
  AUDIENCE_LABELS: typeof AUDIENCE_LABELS;
}

const AdsContext = createContext<AdsContextType | null>(null);

function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [ads, setAds] = useState<Ad[]>([]);
  // Throttle impression tracking: dedupe within session
  const trackedImpressionsRef = React.useRef<Set<string>>(new Set());

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
            cta: (data.cta as AdCTA) ?? "Learn More",
            budget: (data.budget as AdBudget) ?? "basic",
            audience: (data.audience as AdAudience) ?? "all",
            status: (data.status as AdStatus) ?? "pending",
            createdAt: tsToIso(data.createdAt),
            impressions: Number(data.impressions ?? 0),
            clicks: Number(data.clicks ?? 0),
          };
        });
        setAds(next);
      },
      () => { /* Firestore unavailable, keep last state */ },
    );
    return unsub;
  }, []);

  const createAd = async (
    ownerId: string,
    data: Omit<Ad, "id" | "ownerId" | "createdAt" | "impressions" | "clicks" | "status">,
  ) => {
    await addDoc(collection(db, "ads"), {
      ownerId,
      sponsorName: data.sponsorName,
      headline: data.headline,
      body: data.body,
      cta: data.cta,
      budget: data.budget,
      audience: data.audience,
      status: "pending" as AdStatus,
      impressions: 0,
      clicks: 0,
      createdAt: serverTimestamp(),
    });
  };

  const pauseAd = async (id: string) => {
    try { await updateDoc(doc(db, "ads", id), { status: "paused" }); } catch { /* ignore */ }
  };

  const resumeAd = async (id: string) => {
    try { await updateDoc(doc(db, "ads", id), { status: "active" }); } catch { /* ignore */ }
  };

  const trackImpression = (id: string) => {
    if (trackedImpressionsRef.current.has(id)) return;
    trackedImpressionsRef.current.add(id);
    updateDoc(doc(db, "ads", id), { impressions: increment(1) }).catch(() => { /* ignore */ });
  };

  const trackClick = (id: string) => {
    updateDoc(doc(db, "ads", id), { clicks: increment(1) }).catch(() => { /* ignore */ });
  };

  const getActiveAds = () => ads.filter((a) => a.status === "active");
  const myAds = (ownerId: string) => ads.filter((a) => a.ownerId === ownerId);

  return (
    <AdsContext.Provider
      value={{
        ads,
        myAds,
        createAd,
        pauseAd,
        resumeAd,
        trackImpression,
        trackClick,
        getActiveAds,
        BUDGET_LABELS,
        AUDIENCE_LABELS,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAds must be used within AdsProvider");
  return ctx;
}
