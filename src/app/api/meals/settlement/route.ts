import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { MonthlyMealSettlement } from '@/models/MonthlyMealSettlement';
import { MealEntry } from '@/models/MealEntry';
import { BazarPurchase } from '@/models/BazarPurchase';
import { Expense } from '@/models/Expense';
import { Payment } from '@/models/Payment';
import { Resident } from '@/models/Resident';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM" e.g. "2026-10"

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'হিসাবের মাস প্রদান করুন (যেমন: 2026-10)' },
        { status: 400 }
      );
    }

    // Check if an existing locked settlement exists
    const existingSettlement = await MonthlyMealSettlement.findOne({ billingMonth: month })
      .populate('lockedBy', 'displayName role')
      .lean();

    if (existingSettlement && existingSettlement.status === 'LOCKED') {
      return NextResponse.json({
        success: true,
        isLocked: true,
        data: existingSettlement,
      });
    }

    // Compute live real-time draft figures for the month
    const [bazarPurchases, extraExpenses, mealEntries, mealDeposits, residents] = await Promise.all([
      BazarPurchase.find({ purchaseDate: { $regex: `^${month}` } }).lean(),
      Expense.find({
        category: 'BAZAR_EXPENSE',
        expenseDate: {
          $gte: new Date(`${month}-01T00:00:00.000Z`),
          $lte: new Date(`${month}-31T23:59:59.999Z`),
        },
      }).lean(),
      MealEntry.find({ date: { $regex: `^${month}` } }).lean(),
      Payment.find({
        purpose: 'MEAL_DEPOSIT',
        isCancelled: false,
        paymentDate: {
          $gte: new Date(`${month}-01T00:00:00.000Z`),
          $lte: new Date(`${month}-31T23:59:59.999Z`),
        },
      }).lean(),
      Resident.find({ status: { $in: ['ACTIVE', 'ON_LEAVE'] } })
        .populate('roomId', 'roomNumber')
        .populate('seatId', 'seatNumber')
        .lean(),
    ]);

    const totalBazarCostPoisha = bazarPurchases.reduce((acc, b) => acc + (b.totalAmountPoisha || 0), 0);
    const extraMessExpensesPoisha = extraExpenses.reduce((acc, e) => acc + (e.amountPoisha || 0), 0);
    const totalMessCostPoisha = totalBazarCostPoisha + extraMessExpensesPoisha;

    const totalMealUnits = mealEntries.reduce((acc, m) => acc + (m.totalUnits || 0), 0);

    // Precise meal rate calculation (handle zero-meal months safely)
    const calculatedMealRatePoisha =
      totalMealUnits > 0 ? Math.round(totalMessCostPoisha / totalMealUnits) : 0;

    // Build breakdown for each resident
    const residentBreakdown = residents.map((res: any) => {
      const resMeals = mealEntries.filter((m) => m.residentId.toString() === res._id.toString());
      const resUnits = resMeals.reduce((acc, m) => acc + (m.totalUnits || 0), 0);
      const mealBillPoisha = Math.round(resUnits * calculatedMealRatePoisha);

      const resDeposits = mealDeposits.filter((d) => d.residentId.toString() === res._id.toString());
      const totalDepositPoisha = resDeposits.reduce((acc, d) => acc + (d.amountPoisha || 0), 0);
      const balancePoisha = totalDepositPoisha - mealBillPoisha;

      return {
        residentId: res._id,
        residentName: res.fullName,
        roomNumber: res.roomId?.roomNumber || '—',
        seatNumber: res.seatId?.seatNumber || '—',
        totalUnits: Number(resUnits.toFixed(2)),
        mealBillPoisha,
        totalDepositPoisha,
        balancePoisha,
      };
    });

    const draftData = {
      billingMonth: month,
      totalBazarCostPoisha,
      extraMessExpensesPoisha,
      totalMessCostPoisha,
      totalMealUnits: Number(totalMealUnits.toFixed(2)),
      calculatedMealRatePoisha,
      residentBreakdown,
      status: existingSettlement?.status || 'DRAFT',
    };

    return NextResponse.json({
      success: true,
      isLocked: false,
      data: draftData,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'মিল সেটেলমেন্ট হিসাব লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Lock and finalize the monthly meal settlement
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'MEAL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const body = await req.json();
    const { month, notes } = body;

    if (!month) {
      return NextResponse.json({ success: false, error: 'হিসাবের মাস প্রদান করুন' }, { status: 400 });
    }

    // Recompute authoritative numbers
    const [bazarPurchases, extraExpenses, mealEntries, mealDeposits, residents] = await Promise.all([
      BazarPurchase.find({ purchaseDate: { $regex: `^${month}` } }).lean(),
      Expense.find({
        category: 'BAZAR_EXPENSE',
        expenseDate: {
          $gte: new Date(`${month}-01T00:00:00.000Z`),
          $lte: new Date(`${month}-31T23:59:59.999Z`),
        },
      }).lean(),
      MealEntry.find({ date: { $regex: `^${month}` } }).lean(),
      Payment.find({
        purpose: 'MEAL_DEPOSIT',
        isCancelled: false,
        paymentDate: {
          $gte: new Date(`${month}-01T00:00:00.000Z`),
          $lte: new Date(`${month}-31T23:59:59.999Z`),
        },
      }).lean(),
      Resident.find({ status: { $in: ['ACTIVE', 'ON_LEAVE'] } })
        .populate('roomId', 'roomNumber')
        .populate('seatId', 'seatNumber')
        .lean(),
    ]);

    const totalBazarCostPoisha = bazarPurchases.reduce((acc, b) => acc + (b.totalAmountPoisha || 0), 0);
    const extraMessExpensesPoisha = extraExpenses.reduce((acc, e) => acc + (e.amountPoisha || 0), 0);
    const totalMessCostPoisha = totalBazarCostPoisha + extraMessExpensesPoisha;
    const totalMealUnits = mealEntries.reduce((acc, m) => acc + (m.totalUnits || 0), 0);

    const calculatedMealRatePoisha =
      totalMealUnits > 0 ? Math.round(totalMessCostPoisha / totalMealUnits) : 0;

    const residentBreakdown = residents.map((res: any) => {
      const resMeals = mealEntries.filter((m) => m.residentId.toString() === res._id.toString());
      const resUnits = resMeals.reduce((acc, m) => acc + (m.totalUnits || 0), 0);
      const mealBillPoisha = Math.round(resUnits * calculatedMealRatePoisha);
      const resDeposits = mealDeposits.filter((d) => d.residentId.toString() === res._id.toString());
      const totalDepositPoisha = resDeposits.reduce((acc, d) => acc + (d.amountPoisha || 0), 0);
      const balancePoisha = totalDepositPoisha - mealBillPoisha;

      return {
        residentId: res._id,
        residentName: res.fullName,
        roomNumber: res.roomId?.roomNumber || '—',
        seatNumber: res.seatId?.seatNumber || '—',
        totalUnits: Number(resUnits.toFixed(2)),
        mealBillPoisha,
        totalDepositPoisha,
        balancePoisha,
      };
    });

    const settlement = await MonthlyMealSettlement.findOneAndUpdate(
      { billingMonth: month },
      {
        billingMonth: month,
        totalBazarCostPoisha,
        extraMessExpensesPoisha,
        totalMessCostPoisha,
        totalMealUnits: Number(totalMealUnits.toFixed(2)),
        calculatedMealRatePoisha,
        residentBreakdown,
        status: 'LOCKED',
        lockedAt: new Date(),
        lockedBy: user.id,
        notes: notes || '',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${month} মাসের মিল হিসাব চূড়ান্ত ও লক করা হয়েছে। মিল রেট: ৳ ${(calculatedMealRatePoisha / 100).toFixed(2)}`,
      data: settlement,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'হিসাব লক সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
