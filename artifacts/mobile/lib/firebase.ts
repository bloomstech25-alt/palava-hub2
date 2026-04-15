import { getApps, getApp, initializeApp } from "firebase/app";
import { initializeAuth, getAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

// initializeAuth once; fall back to getAuth if already initialized
let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
  });
} catch {
  _auth = getAuth(app);
}

export const auth = _auth;
// Use the named 'default' database (not the system '(default)' database)
export const db = getFirestore(app, "default");
export const storage = getStorage(app);

export default app;
