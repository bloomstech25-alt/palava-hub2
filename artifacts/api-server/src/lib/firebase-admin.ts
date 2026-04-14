import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "palava-hub",
  });
}

export const firestore = admin.firestore();
export const authAdmin = admin.auth();
export default admin;
