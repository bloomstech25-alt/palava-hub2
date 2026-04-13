import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, adminPostsTable } from "@workspace/db";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  DeletePostParams,
  FlagPostParams,
  FlagPostResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/posts", async (req, res): Promise<void> => {
  const query = ListPostsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.search) {
    conditions.push(like(adminPostsTable.content, `%${query.data.search}%`));
  }
  if (query.data.flagged !== undefined) {
    conditions.push(eq(adminPostsTable.isFlagged, query.data.flagged));
  }

  const posts = await db
    .select()
    .from(adminPostsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(adminPostsTable.createdAt);

  res.json(ListPostsResponse.parse(posts.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))));
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .delete(adminPostsTable)
    .where(eq(adminPostsTable.id, params.data.id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/posts/:id/flag", async (req, res): Promise<void> => {
  const params = FlagPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .update(adminPostsTable)
    .set({ isFlagged: true })
    .where(eq(adminPostsTable.id, params.data.id))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(FlagPostResponse.parse({
    ...post,
    createdAt: post.createdAt.toISOString(),
  }));
});

export default router;
