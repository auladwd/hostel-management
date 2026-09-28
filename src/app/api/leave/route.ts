import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { LeaveRequest } from '@/models/LeaveRequest';
import { Resident } from '@/models/Resident';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const residentId = searchParams.get('residentId');

    const query: Record<string, unknown> = {};

    if (user.role === 'RESIDENT') {
      if (!user.linkedResidentId) {
        return NextResponse.json({ success: true, data: [] });
      }
      query.residentId = user.linkedResidentId;
    } else if (residentId) {
      query.residentId = residentId;
    }

    if (status && status !== 'ALL') query.status = status;

    const leaves = await LeaveRequest.find(query)
      .populate('residentId', 'fullName residentId phone photoUrl')
      .populate({
        path: 'residentId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'seatId', select: 'seatNumber' },
        ],
      })
      .populate('approvedBy', 'displayName role')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: leaves });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ছুটির আবেদন লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const body = await req.json();
    const {
      residentId,
      departureDate,
      expectedReturnDate,
      reason,
      destinationAddress,
      emergencyPhone,
    } = body;

    const targetResidentId = user.role === 'RESIDENT' ? user.linkedResidentId : residentId;

    if (!targetResidentId || !departureDate || !expectedReturnDate || !reason || !destinationAddress || !emergencyPhone) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে ছুটির সকল তথ্য পূরণ করুন' },
        { status: 400 }
      );
    }

    const leave = await LeaveRequest.create({
      residentId: targetResidentId,
      departureDate: new Date(departureDate),
      expectedReturnDate: new Date(expectedReturnDate),
      reason: reason.trim(),
      destinationAddress: destinationAddress.trim(),
      emergencyPhone: emergencyPhone.trim(),
      status: user.role === 'OWNER' || user.role === 'HOSTEL_MANAGER' ? 'APPROVED' : 'PENDING',
      approvedBy: (user.role === 'OWNER' || user.role === 'HOSTEL_MANAGER') ? user.id : undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'ছুটির আবেদন সফলভাবে জমা দেওয়া হয়েছে',
      data: leave,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ছুটির আবেদন গ্রহণ করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Approve, Reject, or Mark Completed (Returned)
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const { leaveId, status, approvalRemarks } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ success: false, error: 'ছুটির আইডি ও স্ট্যাটাস আবশ্যক' }, { status: 400 });
    }

    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      return NextResponse.json({ success: false, error: 'আবেদন পাওয়া যায়নি' }, { status: 404 });
    }

    leave.status = status;
    leave.approvedBy = user.id as any;
    if (approvalRemarks) leave.approvalRemarks = approvalRemarks;

    if (status === 'COMPLETED') {
      leave.actualReturnDate = new Date();
      // Set resident status back to ACTIVE
      await Resident.findByIdAndUpdate(leave.residentId, { status: 'ACTIVE' });
    } else if (status === 'APPROVED') {
      // Set resident status to ON_LEAVE
      await Resident.findByIdAndUpdate(leave.residentId, { status: 'ON_LEAVE' });
    }

    await leave.save();

    return NextResponse.json({
      success: true,
      message: `ছুটির স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে`,
      data: leave,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'স্ট্যাটাস আপডেট করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
