import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");

const serviceAccount = JSON.parse(readFileSync(credPath, "utf-8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

// The Firestore database was created as a named database with id 'default'
// (not the system-default '(default)'). Must specify databaseId explicitly.
const fs = getFirestore(admin.app(), "default");
fs.settings({ preferRest: true });

export const firestore = fs;
export const authAdmin = admin.auth();
export default admin;
