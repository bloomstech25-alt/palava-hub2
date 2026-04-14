import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "palava-hub",
  });
}

const fs = admin.firestore();
fs.settings({ preferRest: true });

export const firestore = fs;
export const authAdmin = admin.auth();
export default admin;
