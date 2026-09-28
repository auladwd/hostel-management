import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { VisitorRecord } from '@/models/VisitorRecord';
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'STAFF']);
    await connectToDatabase();

    const visitors = await VisitorRecord.find()
      .populate('residentId', 'fullName residentId phone photoUrl')
      .populate({
        path: 'residentId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'seatId', select: 'seatNumber' },
        ],
      })
      .populate('recordedBy', 'displayName role')
      .sort({ entryTime: -1 })
      .lean();

    return NextResponse.json({ success: true, data: visitors });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ভিজিটর তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'STAFF']);
    await connectToDatabase();

    const body = await req.json();
    const {
      visitorName,
      visitorPhone,
      residentId,
      relationWithResident,
      purpose,
      nidOrIdNumber,
      remarks,
    } = body;

    if (!visitorName || !visitorPhone || !residentId || !purpose) {
      return NextResponse.json(
        { success: false, error: 'ভিজিটরের নাম, মোবাইল, বর্ডার ও সাক্ষাতের উদ্দেশ্য আবশ্যক' },
        { status: 400 }
      );
    }

    const visitor = await VisitorRecord.create({
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim(),
      residentId,
      relationWithResident: relationWithResident || 'পরিচিত',
      purpose: purpose.trim(),
      nidOrIdNumber: nidOrIdNumber || '',
      entryTime: new Date(),
      recordedBy: user.id,
      remarks: remarks || '',
    });

    return NextResponse.json({
      success: true,
      message: `${visitor.visitorName}-এর এন্ট্রি সফলভাবে রেকর্ড করা হয়েছে`,
      data: visitor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ভিজিটর এন্ট্রি সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Record visitor exit time
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'STAFF']);
    await connectToDatabase();

    const body = await req.json();
    const { visitorId } = body;

    if (!visitorId) {
      return NextResponse.json({ success: false, error: 'ভিজিটর আইডি আবশ্যক' }, { status: 400 });
    }

    const visitor = await VisitorRecord.findByIdAndUpdate(
      visitorId,
      { exitTime: new Date() },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'ভিজিটরের প্রস্থান সফলভাবে রেকর্ড করা হয়েছে',
      data: visitor,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'প্রস্থান রেকর্ড করা সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
