import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function assertFirebaseConfig() {
  const missing = Object.entries({
    EXPO_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
    EXPO_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0 && __DEV__) {
    console.warn(
      `[firebase] Missing env: ${missing.join(', ')} — copy frontend/.env.example to .env`
    );
  }
}

assertFirebaseConfig();

export function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
}

export const app = getFirebaseApp();

/** Auth with AsyncStorage persistence (survives app restarts). */
export function getFirebaseAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = getFirebaseAuth();

export const db = getFirestore(app);
export const storage = getStorage(app);
