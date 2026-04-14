import { Router, type IRouter } from "express";
import { firestore, authAdmin } from "../lib/firebase-admin";
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

router.get("/users", async (req, res): Promise<void> => {
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

router.post("/users/:id/ban", async (req, res): Promise<void> => {
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

    await ref.update({ isBanned: true });
    try {
      await authAdmin.updateUser(params.data.id, { disabled: true });
    } catch {
    }

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

router.post("/users/:id/unban", async (req, res): Promise<void> => {
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

    await ref.update({ isBanned: false });
    try {
      await authAdmin.updateUser(params.data.id, { disabled: false });
    } catch {
    }

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

router.delete("/users/:id", async (req, res): Promise<void> => {
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

    await ref.delete();

    try {
      await authAdmin.deleteUser(params.data.id);
    } catch {
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
