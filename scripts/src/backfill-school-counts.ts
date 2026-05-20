/**
 * One-shot script: recompute the `userCount` on every Firestore `schools` doc
 * from the actual number of `users` whose `school.name` matches.
 *
 * Use cases:
 *   - First run after deploying the count-tracking feature (existing users
 *     joined before the increment hook was added).
 *   - Repairing drift if writes ever fail (the mobile hooks are best-effort).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run backfill-school-counts
 *
 * Idempotent: it sets the exact count, so re-running is always safe.
 *
 * Requires the FIREBASE_SERVICE_ACCOUNT secret (same as the other scripts).
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  fail(
    "FIREBASE_SERVICE_ACCOUNT environment variable is not set.\n" +
      "Add it as a secret with the JSON contents of your Firebase service account key."
  );
}

let serviceAccount: Record<string, unknown>;
try {
  serviceAccount = JSON.parse(serviceAccountJson);
} catch (err) {
  fail(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${(err as Error).message}`);
}

if (getApps().length === 0) {
  initializeApp({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credential: cert(serviceAccount as any),
  });
}

// Match the mobile/admin convention: explicitly use the "default" database.
const db = getFirestore("default");

async function main() {
  console.log(`\nBackfilling school userCount from real users…\n`);

  // 1. Count users per school name (case-insensitive, trimmed).
  const usersSnap = await db.collection("users").get();
  const countsByName = new Map<string, number>();
  let usersWithoutSchool = 0;
  for (const d of usersSnap.docs) {
    const data = d.data();
    const name =
      typeof data?.school?.name === "string" ? data.school.name.trim() : "";
    if (!name) {
      usersWithoutSchool++;
      continue;
    }
    const key = name.toLowerCase();
    countsByName.set(key, (countsByName.get(key) ?? 0) + 1);
  }
  console.log(
    `Scanned ${usersSnap.size} users (${usersWithoutSchool} have no school set).`
  );

  // 2. Walk every school doc and set its `userCount` to the tallied number.
  const schoolsSnap = await db.collection("schools").get();
  console.log(`Updating ${schoolsSnap.size} school docs…`);

  let updated = 0;
  let unchanged = 0;
  let batch = db.batch();
  let inBatch = 0;
  const unmatched = new Set<string>(countsByName.keys());

  for (const d of schoolsSnap.docs) {
    const data = d.data();
    const schoolName =
      typeof data?.name === "string" ? data.name.trim() : "";
    if (!schoolName) continue;
    const key = schoolName.toLowerCase();
    const actual = countsByName.get(key) ?? 0;
    unmatched.delete(key);
    const current = typeof data?.userCount === "number" ? data.userCount : 0;
    if (current === actual) {
      unchanged++;
      continue;
    }
    batch.update(d.ref, { userCount: actual });
    updated++;
    inBatch++;
    if (inBatch >= 400) {
      await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();

  console.log(
    `\n✓ Backfill complete: ${updated} updated, ${unchanged} already correct.`
  );

  if (unmatched.size > 0) {
    console.log(
      `\nℹ ${unmatched.size} school name(s) appear on users but have no matching school doc:`
    );
    for (const k of unmatched) {
      console.log(`   - "${k}" (${countsByName.get(k)} user(s))`);
    }
    console.log(
      `   Add them via the admin's Schools tab (or seed-schools) to track them.\n`
    );
  } else {
    console.log("");
  }
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err);
  process.exit(1);
});
