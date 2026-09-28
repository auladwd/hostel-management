import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Expense } from '@/models/Expense';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month'); // "YYYY-MM"

    const query: Record<string, unknown> = {};
    if (category && category !== 'ALL') query.category = category;

    if (month) {
      const [y, m] = month.split('-').map(Number);
      query.expenseDate = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59),
      };
    }

    const expenses = await Expense.find(query)
      .populate('recordedBy', 'displayName role')
      .sort({ expenseDate: -1, createdAt: -1 })
      .lean();

    const totalExpensePoisha = expenses.reduce((acc, e) => acc + (e.amountPoisha || 0), 0);

    return NextResponse.json({
      success: true,
      data: expenses,
      summary: {
        totalExpensePoisha,
        count: expenses.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'খরচ তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const body = await req.json();
    const { category, title, description, amountTaka, expenseDate, paidTo, paymentSource, receiptImageUrl, receiptPublicId } = body;

    if (!category || !title || !amountTaka || !paidTo) {
      return NextResponse.json(
        { success: false, error: 'ক্যাটাগরি, খরচের বিবরণ, টাকার পরিমাণ ও গ্রহীতার নাম আবশ্যক' },
        { status: 400 }
      );
    }

    const amountPoisha = Math.round(Number(amountTaka) * 100);
    const year = new Date().getFullYear();
    const count = await Expense.countDocuments();
    const voucherNumber = `EXP-${year}-${String(count + 1).padStart(5, '0')}`;

    const expense = await Expense.create({
      voucherNumber,
      category,
      title: title.trim(),
      description: description || '',
      amountPoisha,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      paidTo: paidTo.trim(),
      paymentSource: paymentSource || 'CASH_IN_HAND',
      receiptImageUrl: receiptImageUrl || '',
      receiptPublicId: receiptPublicId || '',
      recordedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `খরচের ভাউচার সফলভাবে যুক্ত হয়েছে (${voucherNumber})`,
      data: expense,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'খরচ যুক্ত করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
