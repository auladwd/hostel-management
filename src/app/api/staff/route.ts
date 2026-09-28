import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Staff } from '@/models/Staff';
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const staffList = await Staff.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: staffList });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'স্টাফ তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['OWNER']);
    await connectToDatabase();

    const body = await req.json();
    const { fullName, phone, role, nid, monthlySalaryTaka, emergencyContact, responsibilities } = body;

    if (!fullName || !phone || !role || !nid) {
      return NextResponse.json(
        { success: false, error: 'নাম, মোবাইল, পদবী ও এনআইডি আবশ্যক' },
        { status: 400 }
      );
    }

    const count = await Staff.countDocuments();
    const staffId = `STF-${String(count + 1).padStart(3, '0')}`;
    const monthlySalaryPoisha = Math.round((Number(monthlySalaryTaka) || 12000) * 100);

    const staff = await Staff.create({
      staffId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
      nid: nid.trim(),
      monthlySalaryPoisha,
      emergencyContact: emergencyContact || phone,
      responsibilities: responsibilities || '',
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      message: `নতুন স্টাফ ${staff.fullName} (${staff.staffId}) সফলভাবে যুক্ত হয়েছে`,
      data: staff,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'স্টাফ যুক্ত করা সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
