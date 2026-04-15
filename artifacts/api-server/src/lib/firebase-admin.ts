import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

function loadServiceAccount(): admin.ServiceAccount {
  // Prefer a JSON string in env var (works in deployed environments)
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (jsonEnv) {
    try {
      return JSON.parse(jsonEnv) as admin.ServiceAccount;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is set but contains invalid JSON");
    }
  }

  // Fall back to a file path (works in local / Replit dev)
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath) {
    try {
      return JSON.parse(readFileSync(credPath, "utf-8")) as admin.ServiceAccount;
    } catch {
      throw new Error(`Could not read service account at path: ${credPath}`);
    }
  }

  throw new Error(
    "Firebase Admin credentials not found. Set FIREBASE_SERVICE_ACCOUNT (JSON string) " +
    "or GOOGLE_APPLICATION_CREDENTIALS (file path)."
  );
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: (serviceAccount as any).project_id,
  });
}

// The Firestore database was created as a named database with id 'default'
// (not the system-default '(default)'). Must specify databaseId explicitly.
const fs = getFirestore(admin.app(), "default");
fs.settings({ preferRest: true });

export const firestore = fs;
export const authAdmin = admin.auth();
export default admin;
