import type { School, User } from "@/context/AuthContext";

export const FALLBACK_SCHOOL: School = {
  id: "",
  name: "",
  type: "high_school",
  location: "",
};

function normalizeSchool(raw: unknown): School {
  if (raw && typeof raw === "object") {
    const r = raw as Partial<School>;
    return {
      id: typeof r.id === "string" ? r.id : "",
      name: typeof r.name === "string" ? r.name : "",
      type: r.type === "university" ? "university" : "high_school",
      location: typeof r.location === "string" ? r.location : "",
    };
  }
  if (typeof raw === "string") {
    return { id: "", name: raw, type: "high_school", location: "" };
  }
  return FALLBACK_SCHOOL;
}

export function normalizeUser(raw: unknown, fallbackId = ""): User {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<User> & {
    [k: string]: unknown;
  };
  return {
    id: typeof r.id === "string" ? r.id : fallbackId,
    name: typeof r.name === "string" ? r.name : "",
    username: typeof r.username === "string" ? r.username : "",
    email: typeof r.email === "string" ? r.email : "",
    school: normalizeSchool(r.school),
    bio: typeof r.bio === "string" ? r.bio : "",
    avatar: typeof r.avatar === "string" ? r.avatar : "",
    followers: typeof r.followers === "number" ? r.followers : 0,
    following: typeof r.following === "number" ? r.following : 0,
    followingIds: Array.isArray(r.followingIds)
      ? (r.followingIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    posts: typeof r.posts === "number" ? r.posts : 0,
    joinedAt: typeof r.joinedAt === "string" ? r.joinedAt : "",
    verificationStatus:
      r.verificationStatus === "approved" ||
      r.verificationStatus === "pending" ||
      r.verificationStatus === "rejected"
        ? r.verificationStatus
        : "none",
    phone: typeof r.phone === "string" ? r.phone : undefined,
    blockedUserIds: Array.isArray(r.blockedUserIds)
      ? (r.blockedUserIds as unknown[]).filter((x): x is string => typeof x === "string")
      : [],
    expoPushToken: typeof r.expoPushToken === "string" ? r.expoPushToken : undefined,
    notifications:
      r.notifications && typeof r.notifications === "object"
        ? (r.notifications as User["notifications"])
        : undefined,
  };
}
