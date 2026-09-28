import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { Expense } from '@/models/Expense';
import { BazarPurchase } from '@/models/BazarPurchase';
import { RentInvoice } from '@/models/RentInvoice';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']);
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM" optional

    let paymentDateFilter: Record<string, unknown> = { isCancelled: false };
    let expenseDateFilter: Record<string, unknown> = {};
    let bazarDateFilter: Record<string, unknown> = {};

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59);

      paymentDateFilter = {
        isCancelled: false,
        paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      };
      expenseDateFilter = {
        expenseDate: { $gte: startOfMonth, $lte: endOfMonth },
      };
      bazarDateFilter = {
        purchaseDate: { $regex: `^${month}` },
      };
    }

    const [payments, expenses, bazars, invoices] = await Promise.all([
      Payment.find(paymentDateFilter).lean(),
      Expense.find(expenseDateFilter).lean(),
      BazarPurchase.find(bazarDateFilter).lean(),
      RentInvoice.find(month ? { billingMonth: month } : {}).lean(),
    ]);

    // Income breakdown
    const rentCollectionsPoisha = payments
      .filter((p) => p.purpose === 'RENT_INVOICE' || p.purpose === 'ADMISSION_FEE')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const mealDepositsPoisha = payments
      .filter((p) => p.purpose === 'MEAL_DEPOSIT')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const securityDepositsPoisha = payments
      .filter((p) => p.purpose === 'SECURITY_DEPOSIT')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const otherIncomePoisha = payments
      .filter((p) => p.purpose === 'OTHER')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const totalIncomeCollectedPoisha = rentCollectionsPoisha + mealDepositsPoisha + otherIncomePoisha;

    // Invoiced Dues
    const totalInvoicedPoisha = invoices.reduce((acc, inv) => acc + (inv.totalPayablePoisha || 0), 0);
    const totalDuesOutstandingPoisha = invoices.reduce((acc, inv) => acc + (inv.dueAmountPoisha || 0), 0);

    // Expense breakdown
    const utilitiesPoisha = expenses
      .filter((e) => e.category.startsWith('UTILITY_'))
      .reduce((acc, e) => acc + (e.amountPoisha || 0), 0);

    const salariesPoisha = expenses
      .filter((e) => e.category === 'STAFF_SALARY')
      .reduce((acc, e) => acc + (e.amountPoisha || 0), 0);

    const maintenancePoisha = expenses
      .filter((e) => e.category === 'MAINTENANCE_REPAIR' || e.category === 'CLEANING_HYGIENE')
      .reduce((acc, e) => acc + (e.amountPoisha || 0), 0);

    const groceryPoisha = bazars.reduce((acc, b) => acc + (b.totalAmountPoisha || 0), 0);

    const otherExpensesPoisha = expenses
      .filter((e) => !e.category.startsWith('UTILITY_') && e.category !== 'STAFF_SALARY' && e.category !== 'MAINTENANCE_REPAIR' && e.category !== 'CLEANING_HYGIENE')
      .reduce((acc, e) => acc + (e.amountPoisha || 0), 0);

    const totalExpensesPoisha = utilitiesPoisha + salariesPoisha + maintenancePoisha + groceryPoisha + otherExpensesPoisha;

    // Net operating balance (Income minus Expenses)
    const netBalancePoisha = totalIncomeCollectedPoisha - totalExpensesPoisha;

    return NextResponse.json({
      success: true,
      data: {
        income: {
          rentCollectionsPoisha,
          mealDepositsPoisha,
          securityDepositsPoisha, // tracked separately
          otherIncomePoisha,
          totalIncomeCollectedPoisha,
          totalInvoicedPoisha,
          totalDuesOutstandingPoisha,
        },
        expense: {
          utilitiesPoisha,
          salariesPoisha,
          maintenancePoisha,
          groceryPoisha,
          otherExpensesPoisha,
          totalExpensesPoisha,
        },
        netBalancePoisha,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'আর্থিক বিবরণী তৈরি করা সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
