import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

function loadSa(): any {
  const j = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (j) return JSON.parse(j);
  const p = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (p) return JSON.parse(readFileSync(p, "utf-8"));
  throw new Error("missing creds");
}
const sa = loadSa();
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = getFirestore(admin.app(), "default");
db.settings({ preferRest: true });
const cols = ["users","posts","conversations","ads","reports","supportRequests","verificationRequests","palavaroomPosts","lives"];
const counts: Record<string, number> = {};
for (const c of cols) counts[c] = (await db.collection(c).count().get()).data().count;
const authUsers = (await admin.auth().listUsers(1000)).users.length;
console.log("Auth users:", authUsers);
console.log("Firestore:", counts);
process.exit(0);
