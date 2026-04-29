import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_PATH = resolve(__dirname, "..", "..", "firestore.rules");
const PROJECT_ID = "palava-hub-rules-test";
const HOST = "127.0.0.1";
const PORT = 8181;

type Result = { name: string; ok: boolean; err?: string };
const results: Result[] = [];

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, err });
    console.log(`  ✗ ${name}\n      ${err}`);
  }
}

async function seedAsAdmin(env: RulesTestEnvironment, fn: (db: any) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await fn(ctx.firestore());
  });
}

function userDoc(id: string, extras: Record<string, unknown> = {}) {
  return {
    id,
    name: id,
    username: id,
    email: `${id}@test.lr`,
    avatar: "",
    school: { id: "uol", name: "University of Liberia", type: "university", location: "Monrovia" },
    bio: "",
    verified: false,
    followers: 0,
    following: 0,
    posts: 0,
    blockedUserIds: [],
    createdAt: new Date().toISOString(),
    ...extras,
  };
}

function postDoc(authorId: string, extras: Record<string, unknown> = {}) {
  return {
    author: { id: authorId, name: authorId, username: authorId, avatar: "", school: { id: "uol", name: "UoL" } },
    authorId,
    content: "Hello world",
    mediaUri: null,
    mediaType: null,
    audioDurationSec: null,
    category: "general",
    likes: 0,
    likedBy: [],
    comments: 0,
    shares: 0,
    isFollowing: false,
    createdAt: new Date(),
    tags: [],
    ...extras,
  };
}

const convId = (a: string, b: string) => [a, b].sort().join("_");

async function main() {
  console.log(`\nLoading rules from: ${RULES_PATH}`);
  console.log(`Connecting to Firestore emulator at ${HOST}:${PORT}\n`);

  const env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, "utf8"),
      host: HOST,
      port: PORT,
    },
  });

  // Seed baseline state.
  await seedAsAdmin(env, async (db) => {
    await setDoc(doc(db, "users", "alice"), userDoc("alice"));
    await setDoc(doc(db, "users", "bob"), userDoc("bob"));
    await setDoc(doc(db, "users", "carol"), userDoc("carol", { blockedUserIds: ["dave"] }));
    await setDoc(doc(db, "users", "dave"), userDoc("dave"));
    await setDoc(doc(db, "users", "eve"), userDoc("eve"));
    await setDoc(doc(db, "posts", "post-alice"), postDoc("alice"));
    await setDoc(doc(db, "posts", "post-bob"), postDoc("bob"));
  });

  const alice = env.authenticatedContext("alice").firestore();
  const bob = env.authenticatedContext("bob").firestore();
  const carol = env.authenticatedContext("carol").firestore();
  const dave = env.authenticatedContext("dave").firestore();
  const eve = env.authenticatedContext("eve").firestore();
  const admin = env.authenticatedContext("zeus", { admin: true }).firestore();
  const anon = env.unauthenticatedContext().firestore();

  console.log("─── 1) Auth gating ──────────────────────────────────────────");
  await check("anon CANNOT read posts", async () => {
    await assertFails(getDoc(doc(anon, "posts", "post-alice")));
  });
  await check("signed-in user CAN read posts", async () => {
    await assertSucceeds(getDoc(doc(alice, "posts", "post-bob")));
  });
  await check("anon CANNOT write reports", async () => {
    await assertFails(addDoc(collection(anon, "reports"), {
      reporterId: "x", targetType: "post", targetId: "p", reason: "spam", status: "pending",
    }));
  });

  console.log("\n─── 2) Reports ──────────────────────────────────────────────");
  await check("user CAN report another user's post (valid reason)", async () => {
    await assertSucceeds(addDoc(collection(alice, "reports"), {
      reporterId: "alice",
      targetType: "post",
      targetId: "post-bob",
      targetUserId: "bob",
      reason: "harassment",
      status: "pending",
      createdAt: serverTimestamp(),
    }));
  });
  await check("user CANNOT forge reporterId", async () => {
    await assertFails(addDoc(collection(alice, "reports"), {
      reporterId: "bob",
      targetType: "post",
      targetId: "post-bob",
      reason: "spam",
      status: "pending",
    }));
  });
  await check("user CANNOT report themselves", async () => {
    await assertFails(addDoc(collection(alice, "reports"), {
      reporterId: "alice",
      targetType: "post",
      targetId: "post-alice",
      targetUserId: "alice",
      reason: "spam",
      status: "pending",
    }));
  });
  await check("user CANNOT submit invalid reason enum", async () => {
    await assertFails(addDoc(collection(alice, "reports"), {
      reporterId: "alice",
      targetType: "post",
      targetId: "post-bob",
      reason: "i-just-dont-like-them",
      status: "pending",
    }));
  });
  await check("user CANNOT submit invalid targetType", async () => {
    await assertFails(addDoc(collection(alice, "reports"), {
      reporterId: "alice",
      targetType: "thoughtcrime",
      targetId: "x",
      reason: "spam",
      status: "pending",
    }));
  });
  await check("user CANNOT submit with status='resolved' (must be pending)", async () => {
    await assertFails(addDoc(collection(alice, "reports"), {
      reporterId: "alice",
      targetType: "post",
      targetId: "post-bob",
      reason: "spam",
      status: "resolved",
    }));
  });
  await check("non-admin CANNOT read reports collection", async () => {
    // Seed a report first.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "reports", "r1"), {
        reporterId: "alice", targetType: "post", targetId: "x", reason: "spam", status: "pending",
      });
    });
    await assertFails(getDoc(doc(alice, "reports", "r1")));
  });
  await check("admin CAN read reports", async () => {
    await assertSucceeds(getDoc(doc(admin, "reports", "r1")));
  });

  console.log("\n─── 3) Users / blocking ─────────────────────────────────────");
  await check("user CAN update own profile", async () => {
    await assertSucceeds(updateDoc(doc(alice, "users", "alice"), { bio: "I am Alice" }));
  });
  await check("user CANNOT update someone else's bio", async () => {
    await assertFails(updateDoc(doc(alice, "users", "bob"), { bio: "hijacked" }));
  });
  await check("user CAN add to OWN blockedUserIds", async () => {
    await assertSucceeds(updateDoc(doc(alice, "users", "alice"), { blockedUserIds: ["bob"] }));
  });
  await check("user CANNOT touch someone else's blockedUserIds", async () => {
    await assertFails(updateDoc(doc(alice, "users", "bob"), { blockedUserIds: ["carol"] }));
  });
  await check("user CANNOT grant themselves admin", async () => {
    await assertFails(updateDoc(doc(alice, "users", "alice"), { admin: true }));
  });
  await check("user CAN bump someone else's followers count (counter-only)", async () => {
    await assertSucceeds(updateDoc(doc(alice, "users", "eve"), { followers: 5 }));
  });

  console.log("\n─── 4) Posts ────────────────────────────────────────────────");
  await check("user CAN create their own post", async () => {
    await assertSucceeds(setDoc(doc(alice, "posts", "p-alice-2"), postDoc("alice")));
  });
  await check("user CANNOT create a post under another author", async () => {
    await assertFails(setDoc(doc(alice, "posts", "p-fake"), postDoc("bob")));
  });
  await check("user CAN delete own post", async () => {
    await assertSucceeds(deleteDoc(doc(alice, "posts", "p-alice-2")));
  });
  await check("user CANNOT delete someone else's post", async () => {
    await assertFails(deleteDoc(doc(alice, "posts", "post-bob")));
  });
  await check("user CAN like (counter increment) on someone else's post", async () => {
    await assertSucceeds(updateDoc(doc(alice, "posts", "post-bob"), {
      likes: 1, likedBy: ["alice"],
    }));
  });
  await check("user CANNOT rewrite content of someone else's post", async () => {
    await assertFails(updateDoc(doc(alice, "posts", "post-bob"), { content: "PWNED" }));
  });

  console.log("\n─── 5) Messaging — block enforcement ────────────────────────");
  // Carol has blocked Dave. Dave attempts to message Carol.
  const carolDaveCid = convId("carol", "dave");
  await check("blocked user (dave) CANNOT send message to carol", async () => {
    await assertFails(addDoc(collection(dave, "conversations", carolDaveCid, "messages"), {
      fromId: "dave", toId: "carol", text: "hi", createdAt: serverTimestamp(), read: false,
    }));
  });
  await check("blocked user (dave) CANNOT write conversation summary on carol's side", async () => {
    await assertFails(setDoc(doc(dave, "users", "carol", "conversations", "dave"), {
      lastMessage: "spam", lastAt: serverTimestamp(),
    }));
  });
  await check("non-blocked user (eve) CAN send message to carol", async () => {
    const cid = convId("carol", "eve");
    await assertSucceeds(addDoc(collection(eve, "conversations", cid, "messages"), {
      fromId: "eve", toId: "carol", text: "hi", createdAt: serverTimestamp(), read: false,
    }));
  });
  await check("non-participant (alice) CANNOT read carol/eve messages", async () => {
    const cid = convId("carol", "eve");
    // First, fetch one message id to attempt read.
    let msgId = "";
    await env.withSecurityRulesDisabled(async (ctx) => {
      const ref = await addDoc(collection(ctx.firestore(), "conversations", cid, "messages"), {
        fromId: "carol", toId: "eve", text: "secret", createdAt: serverTimestamp(), read: false,
      });
      msgId = ref.id;
    });
    await assertFails(getDoc(doc(alice, "conversations", cid, "messages", msgId)));
  });
  await check("sender CANNOT spoof fromId", async () => {
    const cid = convId("alice", "bob");
    await assertFails(addDoc(collection(alice, "conversations", cid, "messages"), {
      fromId: "bob", toId: "alice", text: "framing bob", createdAt: serverTimestamp(), read: false,
    }));
  });
  await check("non-participant CANNOT inject message into someone else's convo", async () => {
    const cid = convId("carol", "eve");
    await assertFails(addDoc(collection(alice, "conversations", cid, "messages"), {
      fromId: "alice", toId: "eve", text: "wedge", createdAt: serverTimestamp(), read: false,
    }));
  });

  console.log("\n─── 6) Default deny ─────────────────────────────────────────");
  await check("write to unknown collection IS denied", async () => {
    await assertFails(setDoc(doc(alice, "secret-vault", "x"), { stolen: true }));
  });
  await check("admin write to unknown collection IS denied (rules are explicit)", async () => {
    await assertFails(setDoc(doc(admin, "secret-vault", "x"), { stolen: true }));
  });

  console.log("\n─── 7) Stress: 50 concurrent legit reports ──────────────────");
  await check("50 concurrent legit report writes succeed", async () => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 50; i++) {
      promises.push(addDoc(collection(alice, "reports"), {
        reporterId: "alice",
        targetType: "post",
        targetId: `post-${i}`,
        targetUserId: "bob",
        reason: i % 2 === 0 ? "spam" : "harassment",
        status: "pending",
        createdAt: serverTimestamp(),
      }));
    }
    await Promise.all(promises.map((p) => assertSucceeds(p as Promise<any>)));
  });

  console.log("\n─── 8) Stress: 50 concurrent forged reports ─────────────────");
  await check("50 concurrent FORGED report writes all rejected", async () => {
    const promises: Promise<unknown>[] = [];
    for (let i = 0; i < 50; i++) {
      promises.push(addDoc(collection(alice, "reports"), {
        reporterId: "bob", // forged
        targetType: "post",
        targetId: `post-${i}`,
        reason: "spam",
        status: "pending",
      }));
    }
    await Promise.all(promises.map((p) => assertFails(p as Promise<any>)));
  });

  await env.cleanup();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n══════════════════════════════════════════════`);
  console.log(`Results: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log(`══════════════════════════════════════════════\n`);
  if (failed > 0) {
    console.log("FAILED checks:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  ✗ ${r.name}\n      ${r.err}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(2);
});
