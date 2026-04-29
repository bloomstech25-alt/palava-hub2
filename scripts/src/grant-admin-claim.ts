/**
 * One-shot script: grant the `admin: true` custom claim to a Firebase user.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run grant-admin <email-or-uid>
 *
 * Requires the FIREBASE_SERVICE_ACCOUNT secret to contain the JSON of a
 * Firebase service account key (downloaded from Firebase Console → Project
 * Settings → Service accounts → Generate new private key).
 *
 * After running, the target user must SIGN OUT and SIGN BACK IN for the new
 * claim to appear in their ID token. The admin web dashboard force-refreshes
 * the token on login, so a single re-login is enough.
 *
 * To revoke admin, pass --revoke:
 *   pnpm --filter @workspace/scripts run grant-admin --revoke <email-or-uid>
 */
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  fail(
    "Missing target. Usage:\n" +
      "  pnpm --filter @workspace/scripts run grant-admin <email-or-uid>\n" +
      "  pnpm --filter @workspace/scripts run grant-admin --revoke <email-or-uid>"
  );
}

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  fail(
    "FIREBASE_SERVICE_ACCOUNT environment variable is not set.\n" +
      "Add it as a secret with the JSON contents of your Firebase service account key.\n" +
      "Get the key from: Firebase Console → Project Settings → Service accounts → Generate new private key"
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

const adminAuth = getAuth();

async function main() {
  const isEmail = target.includes("@");
  let uid: string;
  let email: string | undefined;

  try {
    const userRecord = isEmail
      ? await adminAuth.getUserByEmail(target)
      : await adminAuth.getUser(target);
    uid = userRecord.uid;
    email = userRecord.email ?? undefined;
  } catch (err) {
    const code = (err as { code?: string }).code ?? "";
    if (code === "auth/user-not-found") {
      fail(
        `No Firebase user found for "${target}".\n` +
          (isEmail
            ? "Make sure the user has registered through the mobile app at least once."
            : "Double-check the UID in Firebase Console → Authentication.")
      );
    }
    fail(`Failed to look up user: ${(err as Error).message}`);
  }

  const existing = await adminAuth.getUser(uid);
  const existingClaims = existing.customClaims ?? {};

  const newClaims: Record<string, unknown> = { ...existingClaims };
  if (revoke) {
    delete newClaims.admin;
  } else {
    newClaims.admin = true;
  }

  await adminAuth.setCustomUserClaims(uid, newClaims);

  console.log(
    `\n✓ ${revoke ? "Revoked" : "Granted"} admin claim for ${email ?? uid} (uid: ${uid})`
  );
  console.log(`  Current claims: ${JSON.stringify(newClaims)}`);
  console.log(
    `\nNote: ${email ?? "the user"} must sign out and sign back in for the change to take effect.\n`
  );
}

main().catch((err) => {
  console.error("\n✗ Unexpected error:", err);
  process.exit(1);
});
