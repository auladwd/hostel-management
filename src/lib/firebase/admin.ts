import { getApps, getApp, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';

/**
 * Firebase Admin SDK Singleton for Server-side Token Verification & Claims Management
 */

function getFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    // If Admin credentials are not yet supplied, return null to allow graceful fallback or mock in development
    return null;
  }

  // Handle escaped newlines in .env files
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    return null;
  }
}

export const adminApp = getFirebaseAdmin();

/**
 * Verifies a Firebase ID token sent from the client
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  const currentApp = adminApp || getFirebaseAdmin();
  if (!currentApp) {
    return null;
  }

  try {
    const auth = getAuth(currentApp);
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
