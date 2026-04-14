import { Router, type IRouter } from "express";
import { db, schoolsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { firestore } from "../lib/firebase-admin";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "studentconnect2024";

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.username !== ADMIN_USERNAME ||
    parsed.data.password !== ADMIN_PASSWORD
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}`).toString(
    "base64"
  );
  res.json(AdminLoginResponse.parse({ success: true, token }));
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      usersSnap,
      postsSnap,
      bannedSnap,
      flaggedSnap,
      totalSchoolsResult,
      universitiesResult,
      highSchoolsResult,
    ] = await Promise.all([
      firestore.collection("users").get(),
      firestore.collection("posts").get(),
      firestore.collection("users").where("isBanned", "==", true).get(),
      firestore.collection("posts").where("isFlagged", "==", true).get(),
      db.select({ count: count() }).from(schoolsTable),
      db
        .select({ count: count() })
        .from(schoolsTable)
        .where(eq(schoolsTable.type, "university")),
      db
        .select({ count: count() })
        .from(schoolsTable)
        .where(eq(schoolsTable.type, "high_school")),
    ]);

    const newUsersToday = usersSnap.docs.filter((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate?.();
      return created && created >= today;
    }).length;

    const newPostsToday = postsSnap.docs.filter((d) => {
      const data = d.data();
      const created = data.createdAt?.toDate?.();
      return created && created >= today;
    }).length;

    res.json(
      GetAdminStatsResponse.parse({
        totalUsers: usersSnap.size,
        totalPosts: postsSnap.size,
        totalSchools: totalSchoolsResult[0].count,
        bannedUsers: bannedSnap.size,
        flaggedPosts: flaggedSnap.size,
        newUsersToday,
        newPostsToday,
        universities: universitiesResult[0].count,
        highSchools: highSchoolsResult[0].count,
      })
    );
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
