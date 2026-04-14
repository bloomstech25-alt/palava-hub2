import { Router, type IRouter } from "express";
import { firestore } from "../lib/firebase-admin";
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

  try {
    let ref: FirebaseFirestore.Query = firestore.collection("posts");

    if (query.data.flagged !== undefined) {
      ref = ref.where("isFlagged", "==", query.data.flagged);
    }

    const snap = await ref.get();

    let posts = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        content: data.content ?? "",
        authorName: data.authorName ?? "",
        authorUsername: data.authorUsername ?? "",
        authorAvatar: data.authorAvatar ?? null,
        isFlagged: data.isFlagged ?? false,
        likesCount: Array.isArray(data.likedBy) ? data.likedBy.length : (data.likesCount ?? 0),
        commentsCount: data.commentsCount ?? 0,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      };
    });

    if (query.data.search) {
      const s = query.data.search.toLowerCase();
      posts = posts.filter((p) => p.content.toLowerCase().includes(s));
    }

    posts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(ListPostsResponse.parse(posts));
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.delete("/posts/:id", async (req, res): Promise<void> => {
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const ref = firestore.collection("posts").doc(params.data.id);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    await ref.delete();
    res.sendStatus(204);
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

router.post("/posts/:id/flag", async (req, res): Promise<void> => {
  const params = FlagPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const ref = firestore.collection("posts").doc(params.data.id);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    await ref.update({ isFlagged: true });

    const data = snap.data()!;
    res.json(
      FlagPostResponse.parse({
        id: snap.id,
        content: data.content ?? "",
        authorName: data.authorName ?? "",
        authorUsername: data.authorUsername ?? "",
        authorAvatar: data.authorAvatar ?? null,
        isFlagged: true,
        likesCount: Array.isArray(data.likedBy) ? data.likedBy.length : (data.likesCount ?? 0),
        commentsCount: data.commentsCount ?? 0,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Error flagging post:", err);
    res.status(500).json({ error: "Failed to flag post" });
  }
});

export default router;
