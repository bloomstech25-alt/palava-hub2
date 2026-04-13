import { Router, type IRouter } from "express";
import { db, schoolsTable, adminUsersTable, adminPostsTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
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

  if (parsed.data.username !== ADMIN_USERNAME || parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}`).toString("base64");
  res.json(AdminLoginResponse.parse({ success: true, token }));
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: count() }).from(adminUsersTable);
  const [totalPostsResult] = await db.select({ count: count() }).from(adminPostsTable);
  const [totalSchoolsResult] = await db.select({ count: count() }).from(schoolsTable);
  const [bannedUsersResult] = await db.select({ count: count() }).from(adminUsersTable).where(eq(adminUsersTable.isBanned, true));
  const [flaggedPostsResult] = await db.select({ count: count() }).from(adminPostsTable).where(eq(adminPostsTable.isFlagged, true));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [newUsersTodayResult] = await db.select({ count: count() }).from(adminUsersTable)
    .where(sql`${adminUsersTable.createdAt} >= ${today}`);
  const [newPostsTodayResult] = await db.select({ count: count() }).from(adminPostsTable)
    .where(sql`${adminPostsTable.createdAt} >= ${today}`);

  const [universitiesResult] = await db.select({ count: count() }).from(schoolsTable)
    .where(eq(schoolsTable.type, "university"));
  const [highSchoolsResult] = await db.select({ count: count() }).from(schoolsTable)
    .where(eq(schoolsTable.type, "high_school"));

  res.json(GetAdminStatsResponse.parse({
    totalUsers: totalUsersResult.count,
    totalPosts: totalPostsResult.count,
    totalSchools: totalSchoolsResult.count,
    bannedUsers: bannedUsersResult.count,
    flaggedPosts: flaggedPostsResult.count,
    newUsersToday: newUsersTodayResult.count,
    newPostsToday: newPostsTodayResult.count,
    universities: universitiesResult.count,
    highSchools: highSchoolsResult.count,
  }));
});

export default router;
