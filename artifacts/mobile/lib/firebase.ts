import { getApps, getApp, initializeApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWD7hvFeO6rp3bTB-pmzJ-ViwvWII6Ds0",
  authDomain: "palava-hub.firebaseapp.com",
  projectId: "palava-hub",
  storageBucket: "palava-hub.firebasestorage.app",
  messagingSenderId: "166869111433",
  appId: "1:166869111433:web:0775f7ed9f45afb42a2c58",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}

export const auth = _auth;
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
