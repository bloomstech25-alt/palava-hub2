import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminPostsTable = pgTable("admin_posts", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorUsername: text("author_username").notNull(),
  schoolName: text("school_name").notNull().default(""),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  isFlagged: boolean("is_flagged").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminPostSchema = createInsertSchema(adminPostsTable).omit({ createdAt: true });
export type InsertAdminPost = z.infer<typeof insertAdminPostSchema>;
export type AdminPost = typeof adminPostsTable.$inferSelect;
