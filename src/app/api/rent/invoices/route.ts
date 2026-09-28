import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { RentInvoice } from '@/models/RentInvoice';
import { Resident } from '@/models/Resident';
import { Settings } from '@/models/Settings';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // e.g. "2026-10"
    const status = searchParams.get('status');
    const residentId = searchParams.get('residentId');

    const query: Record<string, unknown> = {};

    // If resident is viewing, force query to their own id
    if (user.role === 'RESIDENT') {
      if (!user.linkedResidentId) {
        return NextResponse.json({ success: true, data: [] });
      }
      query.residentId = user.linkedResidentId;
    } else if (residentId) {
      query.residentId = residentId;
    }

    if (month && month !== 'ALL') query.billingMonth = month;
    if (status && status !== 'ALL') query.status = status;

    const invoices = await RentInvoice.find(query)
      .populate('residentId', 'fullName residentId phone photoUrl roomNumber seatNumber')
      .populate({
        path: 'residentId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'seatId', select: 'seatNumber' },
          { path: 'buildingId', select: 'name' },
        ],
      })
      .sort({ billingMonth: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: invoices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ইনভয়েস লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Generate monthly invoices for all active residents or a single resident
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const body = await req.json();
    const { billingMonth, utilityChargesTaka, serviceChargesTaka, residentId, notes } = body;

    if (!billingMonth) {
      return NextResponse.json(
        { success: false, error: 'হিসাবের মাস প্রদান করুন (যেমন: 2026-10)' },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne().lean();
    const prefix = settings?.invoicePrefix || 'INV';
    const dueDay = settings?.rentDueDay || 5;

    // Determine due date (e.g. 5th of the billing month)
    const [yearStr, monthStr] = billingMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const dueDate = new Date(year, month - 1, dueDay, 23, 59, 59);

    const utilityPoisha = Math.round((Number(utilityChargesTaka) || 0) * 100);
    const servicePoisha = Math.round((Number(serviceChargesTaka) || 0) * 100);

    const residentQuery: Record<string, unknown> = {
      status: { $in: ['ACTIVE', 'ON_LEAVE'] },
      seatId: { $ne: null },
    };

    if (residentId) {
      residentQuery._id = residentId;
    }

    const eligibleResidents = await Resident.find(residentQuery).lean();

    if (eligibleResidents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ইনভয়েস তৈরির মতো কোনো সক্রিয় বর্ডার পাওয়া যায়নি' },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const res of eligibleResidents) {
      // Prevent duplicate monthly invoice
      const existing = await RentInvoice.findOne({
        residentId: res._id,
        billingMonth,
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      const totalCount = await RentInvoice.countDocuments();
      const invoiceNumber = `${prefix}-${yearStr}${monthStr}-${String(totalCount + 1).padStart(5, '0')}`;

      const roomRentPoisha = res.monthlyRentPoisha || 350000;
      const totalPayablePoisha = roomRentPoisha + utilityPoisha + servicePoisha;

      await RentInvoice.create({
        invoiceNumber,
        residentId: res._id,
        billingMonth,
        roomRentPoisha,
        utilityChargesPoisha: utilityPoisha,
        serviceChargesPoisha: servicePoisha,
        admissionFeePoisha: 0,
        securityDepositPoisha: 0,
        lateFeePoisha: 0,
        discountPoisha: 0,
        totalPayablePoisha,
        paidAmountPoisha: 0,
        dueAmountPoisha: totalPayablePoisha,
        status: 'UNPAID',
        dueDate,
        generatedBy: user.id,
        notes: notes || `${billingMonth} মাসের মাসিক হোস্টেল ভাড়া ও ইউটিলিটি`,
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${createdCount} জন বর্ডারের জন্য ${billingMonth} মাসের ইনভয়েস সফলভাবে তৈরি করা হয়েছে। (${skippedCount}টি পূর্বেই তৈরি থাকায় বাদ দেওয়া হয়েছে)`,
      data: { createdCount, skippedCount },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ইনভয়েস তৈরি সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
