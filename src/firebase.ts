import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import config from "../firebase-applet-config.json";

// Safely initialize Firebase app
const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize services
export const auth = getAuth(app);

// Use custom settings to ensure robust client behavior with custom Firestore database ID
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, config.firestoreDatabaseId);
