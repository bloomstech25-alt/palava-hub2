import { Router, type IRouter } from "express";
import { firestore, authAdmin } from "../lib/firebase-admin";
import { requireAdmin } from "../lib/require-admin";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  BanUserParams,
  BanUserResponse,
  UnbanUserParams,
  UnbanUserResponse,
  DeleteUserParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Admin-only: exposes user PII (email) and moderation flags.
router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const query = ListUsersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
    let ref: FirebaseFirestore.Query = firestore.collection("users");

    if (query.data.banned !== undefined) {
      ref = ref.where("isBanned", "==", query.data.banned);
    }

    const snap = await ref.get();

    let users = snap.docs.map((d) => {
      const data = d.data();
      const school = data.school;
      const schoolName = typeof school === "object" && school !== null
        ? (school.name ?? "")
        : (school ?? "");
      return {
        id: d.id,
        name: data.name ?? "",
        email: data.email ?? "",
        username: data.username ?? "",
        schoolName,
        postCount: data.posts ?? 0,
        followerCount: data.followers ?? 0,
        isBanned: data.isBanned ?? false,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      };
    });

    if (query.data.search) {
      const s = query.data.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.username.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    if (query.data.schoolId) {
      const s = query.data.schoolId.toLowerCase();
      users = users.filter((u) =>
        u.schoolName.toLowerCase().includes(s)
      );
    }

    users.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json(ListUsersResponse.parse(users));
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users/:id/ban", requireAdmin, async (req, res): Promise<void> => {
  const params = BanUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const ref = firestore.collection("users").doc(params.data.id);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      await authAdmin.updateUser(params.data.id, { disabled: true });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/user-not-found") {
        req.log.error({ err, uid: params.data.id }, "Failed to disable Firebase Auth user");
        res.status(502).json({
          error: `Could not disable Firebase Auth account: ${
            (err as Error)?.message ?? code ?? "unknown error"
          }`,
        });
        return;
      }
      req.log.warn({ uid: params.data.id }, "No Firebase Auth account to disable; proceeding with Firestore flag");
    }
    await ref.update({ isBanned: true });

    const data = snap.data()!;
    const banSchool = data.school;
    const banSchoolName = typeof banSchool === "object" && banSchool !== null ? (banSchool.name ?? "") : (banSchool ?? "");
    res.json(
      BanUserResponse.parse({
        id: snap.id,
        name: data.name ?? "",
        email: data.email ?? "",
        username: data.username ?? "",
        schoolName: banSchoolName,
        postCount: data.posts ?? 0,
        followerCount: data.followers ?? 0,
        isBanned: true,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Error banning user:", err);
    res.status(500).json({ error: "Failed to ban user" });
  }
});

router.post("/users/:id/unban", requireAdmin, async (req, res): Promise<void> => {
  const params = UnbanUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const ref = firestore.collection("users").doc(params.data.id);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      await authAdmin.updateUser(params.data.id, { disabled: false });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/user-not-found") {
        req.log.error({ err, uid: params.data.id }, "Failed to re-enable Firebase Auth user");
        res.status(502).json({
          error: `Could not re-enable Firebase Auth account: ${
            (err as Error)?.message ?? code ?? "unknown error"
          }`,
        });
        return;
      }
      req.log.warn({ uid: params.data.id }, "No Firebase Auth account to re-enable; clearing Firestore flag");
    }
    await ref.update({ isBanned: false });

    const data = snap.data()!;
    const unbanSchool = data.school;
    const unbanSchoolName = typeof unbanSchool === "object" && unbanSchool !== null ? (unbanSchool.name ?? "") : (unbanSchool ?? "");
    res.json(
      UnbanUserResponse.parse({
        id: snap.id,
        name: data.name ?? "",
        email: data.email ?? "",
        username: data.username ?? "",
        schoolName: unbanSchoolName,
        postCount: data.posts ?? 0,
        followerCount: data.followers ?? 0,
        isBanned: false,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString?.() ??
          new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error("Error unbanning user:", err);
    res.status(500).json({ error: "Failed to unban user" });
  }
});

router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const ref = firestore.collection("users").doc(params.data.id);
    const snap = await ref.get();

    if (!snap.exists) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Delete Firebase Auth account FIRST so a failure leaves the
    // Firestore profile intact (no half-deleted state where the Auth
    // login still works but the profile is gone).
    try {
      await authAdmin.deleteUser(params.data.id);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code !== "auth/user-not-found") {
        req.log.error({ err, uid: params.data.id }, "Failed to delete Firebase Auth user");
        res.status(502).json({
          error: `Could not delete Firebase Auth account: ${
            (err as Error)?.message ?? code ?? "unknown error"
          }`,
        });
        return;
      }
      req.log.warn({ uid: params.data.id }, "No Firebase Auth account to delete; proceeding with Firestore cleanup");
    }

    // Delete all posts by this user
    const postsSnap = await firestore
      .collection("posts")
      .where("authorId", "==", params.data.id)
      .get();

    if (!postsSnap.empty) {
      const batch = firestore.batch();
      postsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // Delete Firestore user profile
    await ref.delete();

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
