import { getApps, getApp, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  type FirestoreSettings,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWD7hvFeO6rp3bTB-pmzJ-ViwvWII6Ds0",
  authDomain: "palava-hub.firebaseapp.com",
  projectId: "palava-hub",
  storageBucket: "palava-hub.firebasestorage.app",
  messagingSenderId: "166869111433",
  appId: "1:166869111433:web:0775f7ed9f45afb42a2c58",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Force long-polling so Firestore works reliably in proxied environments
// (Replit's proxy blocks WebSocket upgrades, causing 600ms timeout errors).
function buildDb() {
  try {
    // `useFetchStreams: false` is intentional and still respected at runtime
    // on Firebase JS SDK ≥10, but its type was dropped from `FirestoreSettings`.
    // Keep the runtime flag and silence the type-only complaint.
    const settings = {
      experimentalAutoDetectLongPolling: true,
      useFetchStreams: false,
    } as FirestoreSettings;
    return initializeFirestore(app, settings, "default");
  } catch {
    return getFirestore(app, "default");
  }
}

export const db = buildDb();
export const storage = getStorage(app);

export default app;
