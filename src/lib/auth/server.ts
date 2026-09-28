import { cookies, headers } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import connectToDatabase from '@/lib/mongodb';
import { User, IUser, UserRole } from '@/models/User';

export interface AuthSession {
  user: {
    id: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    status: string;
    linkedResidentId?: string;
    linkedStaffId?: string;
  };
}

/**
 * Extracts and verifies the current authenticated user on the server.
 * Reads either the HTTP-only cookie 'hostel_token' or Authorization header.
 */
export async function getCurrentUser(): Promise<AuthSession['user'] | null> {
  try {
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('hostel_token')?.value;

    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = tokenFromCookie || tokenFromHeader;

    // Development demo bypass check (allows local demo if explicitly enabled)
    const demoRoleCookie = cookieStore.get('hostel_demo_role')?.value as UserRole | undefined;
    if (process.env.NODE_ENV === 'development' && demoRoleCookie && !token) {
      return {
        id: 'demo-user-id',
        firebaseUid: 'demo-firebase-uid',
        email: 'demo@hostel.example.com',
        displayName: 'ডেমো ব্যবহারকারী',
        role: demoRoleCookie,
        status: 'ACTIVE',
      };
    }

    if (!token) {
      return null;
    }

    // Verify token with Firebase Admin
    const decodedToken = await verifyIdToken(token);
    if (!decodedToken) {
      return null;
    }

    await connectToDatabase();

    // Check if user exists in MongoDB
    let dbUser = await User.findOne({ firebaseUid: decodedToken.uid });

    // Secure owner bootstrapping if email matches INITIAL_OWNER_EMAIL
    const initialOwnerEmail = process.env.INITIAL_OWNER_EMAIL?.toLowerCase().trim();
    const isInitialOwner = initialOwnerEmail && decodedToken.email?.toLowerCase().trim() === initialOwnerEmail;

    if (!dbUser) {
      // First-time registration
      const totalUsers = await User.countDocuments();
      const role: UserRole = (isInitialOwner || totalUsers === 0) ? 'OWNER' : 'RESIDENT';

      dbUser = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'হোস্টেল সদস্য',
        photoURL: decodedToken.picture || '',
        role,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      });
    } else {
      // If user is designated initial owner but not yet marked
      if (isInitialOwner && dbUser.role !== 'OWNER') {
        dbUser.role = 'OWNER';
        await dbUser.save();
      }

      // Update login timestamp
      dbUser.lastLoginAt = new Date();
      await dbUser.save();
    }

    if (dbUser.status !== 'ACTIVE') {
      return null; // Deactivated / Suspended account
    }

    return {
      id: dbUser._id.toString(),
      firebaseUid: dbUser.firebaseUid,
      email: dbUser.email,
      displayName: dbUser.displayName,
      photoURL: dbUser.photoURL,
      role: dbUser.role,
      status: dbUser.status,
      linkedResidentId: dbUser.linkedResidentId?.toString(),
      linkedStaffId: dbUser.linkedStaffId?.toString(),
    };
  } catch (error) {
    console.error('getCurrentUser Error:', error);
    return null;
  }
}

/**
 * Server-side RBAC guard for Route Handlers and Server Actions.
 * Throws an error or returns user if authorized.
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthSession['user']> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('অননুমোদিত অ্যাক্সেস। দয়া করে লগইন করুন। (Unauthorized: Please log in)');
  }

  // Super Admin / Owner always has all permissions
  if (user.role === 'OWNER') {
    return user;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      throw new Error('আপনার এই অ্যাকশনটি সম্পন্ন করার প্রয়োজনীয় অনুমতি নেই। (Forbidden: Insufficient privileges)');
    }
  }

  return user;
}
