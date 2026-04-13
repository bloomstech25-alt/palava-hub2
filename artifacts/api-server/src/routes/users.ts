import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, adminUsersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  BanUserParams,
  BanUserResponse,
  UnbanUserParams,
  UnbanUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.search) {
    conditions.push(like(adminUsersTable.name, `%${query.data.search}%`));
  }
  if (query.data.schoolId) {
    conditions.push(like(adminUsersTable.schoolName, `%${query.data.schoolId}%`));
  }
  if (query.data.banned !== undefined) {
    conditions.push(eq(adminUsersTable.isBanned, query.data.banned));
  }

  const users = await db
    .select()
    .from(adminUsersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(adminUsersTable.createdAt);

  res.json(ListUsersResponse.parse(users.map(u => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }))));
});

router.post("/users/:id/ban", async (req, res): Promise<void> => {
  const params = BanUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(adminUsersTable)
    .set({ isBanned: true })
    .where(eq(adminUsersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(BanUserResponse.parse({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.post("/users/:id/unban", async (req, res): Promise<void> => {
  const params = UnbanUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(adminUsersTable)
    .set({ isBanned: false })
    .where(eq(adminUsersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UnbanUserResponse.parse({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));
});

export default router;
