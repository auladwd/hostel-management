import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const notifications = await Notification.find({
      $or: [
        { recipientUserId: user.id },
        { recipientRole: user.role },
        { recipientRole: null, recipientUserId: null }, // broadcast to all
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বিজ্ঞপ্তি লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const { title, message, type, recipientRole, recipientUserId, link } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'শিরোনাম ও নোটিশের মূল বক্তব্য আবশ্যক' },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      title: title.trim(),
      message: message.trim(),
      type: type || 'GENERAL_NOTICE',
      recipientRole: recipientRole || null,
      recipientUserId: recipientUserId || null,
      link: link || '',
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: 'নোটিশ সফলভাবে প্রচার করা হয়েছে',
      data: notification,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'নোটিশ পাঠানো সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Mark notification as read
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      // Mark all read for this user
      await Notification.updateMany({ isRead: false }, { isRead: true });
    }

    return NextResponse.json({ success: true, message: 'বিজ্ঞপ্তি পড়া হয়েছে হিসেবে চিহ্নিত' });
  } catch {
    return NextResponse.json({ success: false, error: 'আপডেট করা যায়নি' }, { status: 400 });
  }
}
