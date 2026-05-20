import type { RequestHandler } from "express";
import { authAdmin } from "./firebase-admin";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const token = header.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  try {
    const decoded = await authAdmin.verifyIdToken(token);
    if (decoded.admin !== true) {
      res.status(403).json({ error: "Admin privileges required" });
      return;
    }
    (req as unknown as { adminUid: string }).adminUid = decoded.uid;
    next();
  } catch (err) {
    req.log?.warn?.({ err }, "Admin token verification failed");
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
