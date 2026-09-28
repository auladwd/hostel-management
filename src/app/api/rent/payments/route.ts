import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { RentInvoice } from '@/models/RentInvoice';
import { Resident } from '@/models/Resident';
import { Settings } from '@/models/Settings';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const residentId = searchParams.get('residentId');
    const invoiceId = searchParams.get('invoiceId');
    const method = searchParams.get('method');

    const query: Record<string, unknown> = { isCancelled: false };

    if (user.role === 'RESIDENT') {
      if (!user.linkedResidentId) {
        return NextResponse.json({ success: true, data: [] });
      }
      query.residentId = user.linkedResidentId;
    } else if (residentId) {
      query.residentId = residentId;
    }

    if (invoiceId) query.invoiceId = invoiceId;
    if (method && method !== 'ALL') query.paymentMethod = method;

    const payments = await Payment.find(query)
      .populate('residentId', 'fullName residentId phone photoUrl')
      .populate('invoiceId', 'invoiceNumber billingMonth totalPayablePoisha dueAmountPoisha')
      .populate('collectedBy', 'displayName role')
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: payments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'পেমেন্ট তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const body = await req.json();
    const {
      residentId,
      invoiceId,
      purpose,
      amountTaka,
      paymentMethod,
      transactionId,
      bankAccountDetails,
      paymentDate,
      remarks,
    } = body;

    if (!residentId || !amountTaka || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'বর্ডার, জমার পরিমাণ এবং পেমেন্ট মেথড আবশ্যক' },
        { status: 400 }
      );
    }

    const resident = await Resident.findById(residentId);
    if (!resident) {
      return NextResponse.json({ success: false, error: 'বর্ডার পাওয়া যায়নি' }, { status: 404 });
    }

    const amountPoisha = Math.round(Number(amountTaka) * 100);
    if (amountPoisha <= 0) {
      return NextResponse.json({ success: false, error: 'বৈধ টাকার পরিমাণ প্রদান করুন' }, { status: 400 });
    }

    const settings = await Settings.findOne().lean();
    const prefix = settings?.receiptPrefix || 'RCT';
    const year = new Date().getFullYear();
    const totalCount = await Payment.countDocuments();
    const receiptNumber = `${prefix}-${year}-${String(totalCount + 1).padStart(5, '0')}`;

    // Create payment receipt
    const payment = await Payment.create({
      receiptNumber,
      residentId: resident._id,
      invoiceId: invoiceId || null,
      purpose: purpose || (invoiceId ? 'RENT_INVOICE' : 'MEAL_DEPOSIT'),
      amountPoisha,
      paymentMethod,
      transactionId: transactionId || '',
      bankAccountDetails: bankAccountDetails || '',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      collectedBy: user.id,
      remarks: remarks || '',
    });

    // If payment is linked to a specific rent invoice, adjust paid and due amounts
    if (invoiceId) {
      const invoice = await RentInvoice.findById(invoiceId);
      if (invoice) {
        invoice.paidAmountPoisha = (invoice.paidAmountPoisha || 0) + amountPoisha;
        const remainingDue = invoice.totalPayablePoisha - invoice.paidAmountPoisha;
        invoice.dueAmountPoisha = remainingDue > 0 ? remainingDue : 0;

        if (invoice.dueAmountPoisha === 0) {
          invoice.status = 'PAID';
        } else {
          invoice.status = 'PARTIAL';
        }

        await invoice.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: `টাকা সফলভাবে জমা হয়েছে। রশিদ নম্বর: ${receiptNumber}`,
      data: payment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'পেমেন্ট গ্রহণ সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
