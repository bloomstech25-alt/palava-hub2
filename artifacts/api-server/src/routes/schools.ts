import { Router, type IRouter } from "express";
import { eq, like, and, sql } from "drizzle-orm";
import { db, schoolsTable } from "@workspace/db";
import {
  ListSchoolsQueryParams,
  ListSchoolsResponse,
  GetSchoolParams,
  GetSchoolResponse,
  CreateSchoolBody,
  UpdateSchoolParams,
  UpdateSchoolBody,
  UpdateSchoolResponse,
  DeleteSchoolParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/require-admin";

const router: IRouter = Router();

// Public: schools list is consumed by the mobile app's signup/school-picker.
router.get("/schools", async (req, res): Promise<void> => {
  const query = ListSchoolsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.type) {
    conditions.push(eq(schoolsTable.type, query.data.type));
  }
  if (query.data.search) {
    conditions.push(like(schoolsTable.name, `%${query.data.search}%`));
  }

  const schools = await db
    .select()
    .from(schoolsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(schoolsTable.name);

  res.json(ListSchoolsResponse.parse(schools.map(s => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }))));
});

router.post("/schools", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = `s_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const [school] = await db.insert(schoolsTable).values({
    id,
    ...parsed.data,
    userCount: 0,
  }).returning();

  res.status(201).json(GetSchoolResponse.parse({
    ...school,
    createdAt: school.createdAt.toISOString(),
  }));
});

// Public: individual school lookup is consumed by the mobile app.
router.get("/schools/:id", async (req, res): Promise<void> => {
  const params = GetSchoolParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [school] = await db
    .select()
    .from(schoolsTable)
    .where(eq(schoolsTable.id, params.data.id));

  if (!school) {
    res.status(404).json({ error: "School not found" });
    return;
  }

  res.json(GetSchoolResponse.parse({
    ...school,
    createdAt: school.createdAt.toISOString(),
  }));
});

router.put("/schools/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateSchoolParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSchoolBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.county !== undefined) updateData.county = parsed.data.county;

  const [school] = await db
    .update(schoolsTable)
    .set(updateData)
    .where(eq(schoolsTable.id, params.data.id))
    .returning();

  if (!school) {
    res.status(404).json({ error: "School not found" });
    return;
  }

  res.json(UpdateSchoolResponse.parse({
    ...school,
    createdAt: school.createdAt.toISOString(),
  }));
});

router.delete("/schools/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteSchoolParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [school] = await db
    .delete(schoolsTable)
    .where(eq(schoolsTable.id, params.data.id))
    .returning();

  if (!school) {
    res.status(404).json({ error: "School not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
