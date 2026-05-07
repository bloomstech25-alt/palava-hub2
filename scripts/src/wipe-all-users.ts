// Nuke every user-generated thing in Firebase so the project is a clean
// slate before App Store upload. Keeps PostgreSQL `schools` intact.
//
// What this deletes:
//   - All Firebase Auth users
//   - All docs in: users (incl. /users/{uid}/conversations subcollection),
//     posts (incl. /posts/{id}/comments subcollection), conversations
//     (incl. /messages subcollection), ads, reports, supportRequests,
//     verificationRequests, palavaroomPosts, lives
//   - All Storage objects under avatars/, posts/, chats/, pages/
//
// Usage:
//   pnpm --filter @workspace/scripts run wipe-all-users -- --yes-i-am-sure
//
// Requires FIREBASE_SERVICE_ACCOUNT (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path).

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { readFileSync } from "fs";

function loadServiceAccount(): admin.ServiceAccount & { project_id?: string } {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (jsonEnv) return JSON.parse(jsonEnv);
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) return JSON.parse(readFileSync(credPath, "utf-8"));
  throw new Error("Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS");
}

const sa = loadServiceAccount();
const projectId = (sa as any).project_id ?? "palava-hub";

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
});

const db = getFirestore(admin.app(), "default");
db.settings({ preferRest: true });
const auth = admin.auth();
const bucket = getStorage().bucket();

const CONFIRM_FLAG = "--yes-i-am-sure";
if (!process.argv.includes(CONFIRM_FLAG)) {
  console.error(`Refusing to run without ${CONFIRM_FLAG}. Aborting.`);
  process.exit(1);
}

async function deleteAllAuthUsers(): Promise<number> {
  let total = 0;
  let pageToken: string | undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    const uids = res.users.map((u) => u.uid);
    if (uids.length) {
      const r = await auth.deleteUsers(uids);
      total += r.successCount;
      if (r.failureCount) console.warn(`  ${r.failureCount} auth deletes failed`);
    }
    pageToken = res.pageToken;
  } while (pageToken);
  return total;
}

// Known subcollection names by parent collection. We delete these manually
// instead of using `recursiveDelete` because that helper aborts the whole
// run on a single NOT_FOUND race, which kept truncating the wipe.
const SUBCOLLECTIONS: Record<string, string[]> = {
  posts: ["comments"],
  conversations: ["messages"],
  users: ["conversations"],
};

async function deleteDocsBatch(refs: FirebaseFirestore.DocumentReference[]): Promise<void> {
  if (!refs.length) return;
  const writer = db.bulkWriter();
  writer.onWriteError(() => true); // swallow NOT_FOUND, retry transient errors
  for (const r of refs) writer.delete(r).catch(() => {});
  await writer.close();
}

async function deleteCollectionRecursive(path: string): Promise<number> {
  const subs = SUBCOLLECTIONS[path.split("/").pop() ?? ""] ?? [];
  let total = 0;
  while (true) {
    const snap = await db.collection(path).limit(300).get();
    if (snap.empty) break;
    // Wipe known subcollections first so we don't orphan nested data.
    for (const doc of snap.docs) {
      for (const sub of subs) {
        await deleteCollectionRecursive(`${doc.ref.path}/${sub}`);
      }
    }
    await deleteDocsBatch(snap.docs.map((d) => d.ref));
    total += snap.docs.length;
    process.stdout.write(`.`);
  }
  return total;
}

async function deleteStoragePrefix(prefix: string): Promise<number> {
  const [files] = await bucket.getFiles({ prefix });
  if (!files.length) return 0;
  const chunks: typeof files[] = [];
  for (let i = 0; i < files.length; i += 100) chunks.push(files.slice(i, i + 100));
  for (const chunk of chunks) {
    await Promise.all(chunk.map((f) => f.delete().catch(() => {})));
  }
  return files.length;
}

(async () => {
  console.log(`Wiping project: ${projectId}`);

  console.log("→ Deleting Auth users…");
  const authCount = await deleteAllAuthUsers();
  console.log(`  ✓ ${authCount} users removed from Auth`);

  const collections = [
    "users",
    "posts",
    "conversations",
    "ads",
    "reports",
    "supportRequests",
    "verificationRequests",
    "palavaroomPosts",
    "lives",
  ];
  for (const c of collections) {
    process.stdout.write(`→ Deleting collection ${c}… `);
    const n = await deleteCollectionRecursive(c);
    console.log(`✓ ${n} docs`);
  }

  const prefixes = ["avatars/", "posts/", "chats/", "pages/"];
  for (const p of prefixes) {
    process.stdout.write(`→ Deleting storage ${p}… `);
    const n = await deleteStoragePrefix(p);
    console.log(`✓ ${n} files`);
  }

  console.log("\nDone. Project is a clean slate (schools table in Postgres untouched).");
  process.exit(0);
})().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
