import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Complaint } from '@/models/Complaint';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
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
    if (category && category !== 'ALL') query.category = category;

    const complaints = await Complaint.find(query)
      .populate('residentId', 'fullName residentId phone photoUrl')
      .populate({
        path: 'residentId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'seatId', select: 'seatNumber' },
        ],
      })
      .populate('assignedStaffId', 'fullName role phone')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: complaints });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'অভিযোগ তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const body = await req.json();
    const { residentId, category, title, description, priority, imageUrl, imagePublicId } = body;

    const targetResidentId = user.role === 'RESIDENT' ? user.linkedResidentId : residentId;

    if (!targetResidentId || !category || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'ক্যাটাগরি, শিরোনাম ও বিস্তারিত বিবরণ আবশ্যক' },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const count = await Complaint.countDocuments();
    const ticketNumber = `CMP-${year}-${String(count + 1).padStart(4, '0')}`;

    const complaint = await Complaint.create({
      ticketNumber,
      residentId: targetResidentId,
      category,
      title: title.trim(),
      description: description.trim(),
      priority: priority || 'MEDIUM',
      status: 'SUBMITTED',
      imageUrl: imageUrl || '',
      imagePublicId: imagePublicId || '',
    });

    return NextResponse.json({
      success: true,
      message: `অভিযোগ সফলভাবে জমা হয়েছে (টিকিট নং: ${ticketNumber})`,
      data: complaint,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'অভিযোগ জমা দেওয়া সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Update complaint status, assign staff or add comment
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const body = await req.json();
    const { complaintId, status, assignedStaffId, resolutionNotes, newComment } = body;

    if (!complaintId) {
      return NextResponse.json({ success: false, error: 'অভিযোগ আইডি আবশ্যক' }, { status: 400 });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return NextResponse.json({ success: false, error: 'অভিযোগ পাওয়া যায়নি' }, { status: 404 });
    }

    // Add comment
    if (newComment) {
      complaint.comments.push({
        commentBy: user.id as any,
        userName: user.displayName,
        userRole: user.role,
        comment: newComment.trim(),
        createdAt: new Date(),
      });
    }

    // Role check for changing status or assignment
    if (user.role !== 'RESIDENT') {
      if (status) {
        complaint.status = status;
        if (status === 'RESOLVED' || status === 'CLOSED') {
          complaint.resolvedAt = new Date();
        }
      }
      if (assignedStaffId !== undefined) {
        complaint.assignedStaffId = assignedStaffId || null;
      }
      if (resolutionNotes !== undefined) {
        complaint.resolutionNotes = resolutionNotes;
      }
    }

    await complaint.save();

    return NextResponse.json({
      success: true,
      message: 'অভিযোগের অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে',
      data: complaint,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'অভিযোগ আপডেট করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
