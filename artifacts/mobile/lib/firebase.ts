import { getApps, getApp, initializeApp } from "firebase/app";
import { initializeAuth, getAuth, inMemoryPersistence } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
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

// experimentalAutoDetectLongPolling: tries WebSocket first, auto-falls back
// to XHR long-polling if the handshake fails (common behind proxies).
// useFetchStreams: false: uses XHR instead of Fetch Streams for compatibility.
function buildDb() {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, "default");
  } catch {
    return getFirestore(app, "default");
  }
}

export const db = buildDb();
export const storage = getStorage(app);

export default app;
