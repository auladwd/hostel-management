import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { StaffSalary } from '@/models/StaffSalary';
import { Staff } from '@/models/Staff';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['OWNER', 'ACCOUNTANT', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM"

    const query: Record<string, unknown> = {};
    if (month) query.salaryMonth = month;

    const salaries = await StaffSalary.find(query)
      .populate('staffId', 'fullName staffId role phone')
      .populate('paidBy', 'displayName role')
      .sort({ salaryMonth: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: salaries });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বেতন রেকর্ড লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'ACCOUNTANT']);
    await connectToDatabase();

    const body = await req.json();
    const { staffId, salaryMonth, bonusTaka, deductionsTaka, paymentMethod, transactionReference, notes } = body;

    if (!staffId || !salaryMonth) {
      return NextResponse.json(
        { success: false, error: 'স্টাফ এবং বেতনের মাস নির্বাচন করুন' },
        { status: 400 }
      );
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return NextResponse.json({ success: false, error: 'স্টাফ পাওয়া যায়নি' }, { status: 404 });
    }

    // Check if salary already paid for this month
    const existing = await StaffSalary.findOne({ staffId: staff._id, salaryMonth });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `${staff.fullName}-কে ${salaryMonth} মাসের বেতন ইতিমধ্যে প্রদান করা হয়েছে` },
        { status: 400 }
      );
    }

    const baseSalaryPoisha = staff.monthlySalaryPoisha;
    const bonusPoisha = Math.round((Number(bonusTaka) || 0) * 100);
    const deductionsPoisha = Math.round((Number(deductionsTaka) || 0) * 100);
    const netPayablePoisha = baseSalaryPoisha + bonusPoisha - deductionsPoisha;

    const year = new Date().getFullYear();
    const count = await StaffSalary.countDocuments();
    const voucherNumber = `SLR-${year}-${String(count + 1).padStart(5, '0')}`;

    const salaryRecord = await StaffSalary.create({
      voucherNumber,
      staffId: staff._id,
      salaryMonth,
      baseSalaryPoisha,
      bonusPoisha,
      deductionsPoisha,
      netPayablePoisha,
      paidAmountPoisha: netPayablePoisha,
      paymentDate: new Date(),
      paymentMethod: paymentMethod || 'CASH',
      transactionReference: transactionReference || '',
      paidBy: user.id,
      notes: notes || '',
    });

    // Also automatically create an Expense entry under 'STAFF_SALARY'
    await Expense.create({
      voucherNumber: `EXP-SLR-${salaryRecord.voucherNumber}`,
      category: 'STAFF_SALARY',
      title: `${staff.fullName} - ${salaryMonth} মাসের বেতন`,
      description: `মূল বেতন: ৳ ${(baseSalaryPoisha / 100).toFixed(2)}, বোনাস: ৳ ${(bonusPoisha / 100).toFixed(2)}, কর্তন: ৳ ${(deductionsPoisha / 100).toFixed(2)}`,
      amountPoisha: netPayablePoisha,
      expenseDate: new Date(),
      paidTo: staff.fullName,
      paymentSource: paymentMethod === 'BANK_TRANSFER' ? 'BANK_ACCOUNT' : 'CASH_IN_HAND',
      recordedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `${staff.fullName}-কে ${salaryMonth} মাসের বেতন (৳ ${(netPayablePoisha / 100).toFixed(2)}) সফলভাবে প্রদান করা হয়েছে`,
      data: salaryRecord,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বেতন প্রদান সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
