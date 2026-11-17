import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Firebase web configuration identifies the client project; it is not an Admin SDK secret.
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Check Firestore connectivity using the authenticated user's access.
 * The `/test/connection` document must exist or be readable under deployed rules.
 * Permission errors are not treated as successful connectivity checks.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  if (!auth.currentUser) {
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    console.warn('Firestore connection check failed:', error);
    return false;
  }
}
