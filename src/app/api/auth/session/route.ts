import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';
import connectToDatabase from '@/lib/mongodb';
import { User, UserRole } from '@/models/User';
import { getCurrentUser } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    const { idToken, demoRole } = await req.json();
    const cookieStore = await cookies();

    // Support demo role switching in development mode
    if (process.env.NODE_ENV === 'development' && demoRole) {
      cookieStore.set('hostel_demo_role', demoRole, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      cookieStore.delete('hostel_token');

      return NextResponse.json({
        success: true,
        message: `${demoRole} হিসেবে ডেমো লগইন সফল হয়েছে`,
        user: {
          id: 'demo-user-id',
          email: 'demo@hostel.example.com',
          displayName: 'ডেমো ব্যবহারকারী',
          role: demoRole,
        },
      });
    }

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'আইডি টোকেন পাওয়া যায়নি' },
        { status: 400 }
      );
    }

    // Verify token with Firebase Admin SDK
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: 'অকার্যকর বা মেয়াদোত্তীর্ণ টোকেন' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const initialOwnerEmail = process.env.INITIAL_OWNER_EMAIL?.toLowerCase().trim();
    const isInitialOwner = initialOwnerEmail && decodedToken.email?.toLowerCase().trim() === initialOwnerEmail;

    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      const count = await User.countDocuments();
      const role: UserRole = (isInitialOwner || count === 0) ? 'OWNER' : 'RESIDENT';

      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'হোস্টেল সদস্য',
        photoURL: decodedToken.picture || '',
        role,
        status: 'ACTIVE',
        lastLoginAt: new Date(),
      });
    } else {
      if (isInitialOwner && user.role !== 'OWNER') {
        user.role = 'OWNER';
      }
      user.lastLoginAt = new Date();
      await user.save();
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'আপনার অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে।' },
        { status: 403 }
      );
    }

    // Store verified token in HTTP-only secure cookie
    cookieStore.set('hostel_token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    cookieStore.delete('hostel_demo_role');

    return NextResponse.json({
      success: true,
      message: 'লগইন সফল হয়েছে',
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: unknown) {
    console.error('Session Error:', error);
    const message = error instanceof Error ? error.message : 'লগইন ব্যর্থ হয়েছে';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('hostel_token');
    cookieStore.delete('hostel_demo_role');

    return NextResponse.json({
      success: true,
      message: 'লগআউট সফল হয়েছে',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'লগআউট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
