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
 * Creates a persistent Firebase Session Cookie from an ID token.
 * Session cookies can remain valid for up to 14 days, unlike raw ID tokens which expire in 1 hour.
 */
export async function createFirebaseSessionCookie(
  idToken: string,
  expiresInMs: number = 60 * 60 * 24 * 5 * 1000 // 5 days
): Promise<string | null> {
  const currentApp = adminApp || getFirebaseAdmin();
  if (!currentApp) return null;

  try {
    const auth = getAuth(currentApp);
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
    return sessionCookie;
  } catch (error) {
    console.warn('Could not create Firebase session cookie, falling back to idToken:', error);
    return null;
  }
}

/**
 * Verifies either a Firebase Session Cookie or a standard Firebase ID token.
 * Handles token expiration gracefully without flooding server logs.
 */
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  const currentApp = adminApp || getFirebaseAdmin();
  if (!currentApp) {
    return null;
  }

  const auth = getAuth(currentApp);

  // 1. Try verifying as a Firebase Session Cookie first (valid for 5-14 days)
  try {
    const decodedSession = await auth.verifySessionCookie(token, false);
    return decodedSession;
  } catch (sessionErr: any) {
    // If it's not a session cookie, try standard ID token
  }

  // 2. Try verifying as an ID token
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    if (error?.code === 'auth/id-token-expired' || error?.code === 'auth/session-cookie-expired') {
      console.warn('Firebase token/session has expired (auth/id-token-expired). User re-authentication required.');
      return null;
    }
    console.error('Error verifying Firebase ID token:', error);
    return null;
  }
}
