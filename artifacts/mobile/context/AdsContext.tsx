import React, { createContext, useContext, useState } from "react";

export type AdStatus = "pending" | "active" | "paused";
export type AdCTA = "Learn More" | "Apply Now" | "Contact Us" | "Visit Website" | "Enroll Now";
export type AdBudget = "basic" | "standard" | "premium";
export type AdAudience = "all" | "university" | "high_school";

export interface Ad {
  id: string;
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

const SAMPLE_ADS: Ad[] = [
  {
    id: "ad1",
    sponsorName: "Liberia Tech Hub",
    headline: "Learn to Code in Monrovia",
    body: "Join West Africa's fastest-growing coding bootcamp. Scholarships available for Liberian students. Applications open now!",
    cta: "Apply Now",
    budget: "standard",
    audience: "all",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    impressions: 1240,
    clicks: 87,
  },
  {
    id: "ad2",
    sponsorName: "UL Career Services",
    headline: "2025 Internship Fair – Register Now",
    body: "Over 40 employers coming to campus this April. Free registration for University of Liberia students. Network and get hired!",
    cta: "Learn More",
    budget: "basic",
    audience: "university",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    impressions: 890,
    clicks: 134,
  },
  {
    id: "ad3",
    sponsorName: "Lonestar Cell",
    headline: "Student Data Plans — 50% Off",
    body: "Stay connected all semester. Lonestar's student bundles give you 10GB for just L$500/month. Available at all campus locations.",
    cta: "Learn More",
    budget: "premium",
    audience: "all",
    status: "active",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    impressions: 3450,
    clicks: 412,
  },
];

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
  createAd: (data: Omit<Ad, "id" | "createdAt" | "impressions" | "clicks" | "status">) => void;
  pauseAd: (id: string) => void;
  resumeAd: (id: string) => void;
  getActiveAds: () => Ad[];
  BUDGET_LABELS: typeof BUDGET_LABELS;
  AUDIENCE_LABELS: typeof AUDIENCE_LABELS;
}

const AdsContext = createContext<AdsContextType | null>(null);

export function AdsProvider({ children }: { children: React.ReactNode }) {
  const [ads, setAds] = useState<Ad[]>(SAMPLE_ADS);

  const createAd = (data: Omit<Ad, "id" | "createdAt" | "impressions" | "clicks" | "status">) => {
    const newAd: Ad = {
      ...data,
      id: "ad_" + Date.now().toString() + Math.random().toString(36).substr(2, 6),
      status: "pending",
      createdAt: new Date().toISOString(),
      impressions: 0,
      clicks: 0,
    };
    setAds((prev) => [newAd, ...prev]);
  };

  const pauseAd = (id: string) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: "paused" } : a)));
  };

  const resumeAd = (id: string) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: "active" } : a)));
  };

  const getActiveAds = () => ads.filter((a) => a.status === "active");

  return (
    <AdsContext.Provider value={{ ads, createAd, pauseAd, resumeAd, getActiveAds, BUDGET_LABELS, AUDIENCE_LABELS }}>
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAds must be used within AdsProvider");
  return ctx;
}
