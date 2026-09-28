import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Resident } from '@/models/Resident';
import { Room } from '@/models/Room';
import { Seat } from '@/models/Seat';
import { RentInvoice } from '@/models/RentInvoice';
import { Payment } from '@/models/Payment';
import { Expense } from '@/models/Expense';
import { MealEntry } from '@/models/MealEntry';
import { BazarPurchase } from '@/models/BazarPurchase';
import { Complaint } from '@/models/Complaint';
import { LeaveRequest } from '@/models/LeaveRequest';
import { Notification } from '@/models/Notification';
import { MonthlyMealSettlement } from '@/models/MonthlyMealSettlement';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    // Current Dhaka date & month
    const now = new Date();
    const currentMonth = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }).substring(0, 7); // "YYYY-MM"
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // "YYYY-MM-DD"

    // 1. IF USER IS A RESIDENT, RETURN RESIDENT-SPECIFIC DASHBOARD STATS
    if (user.role === 'RESIDENT' && user.linkedResidentId) {
      const resident = await Resident.findById(user.linkedResidentId)
        .populate('buildingId', 'name code')
        .populate('roomId', 'roomNumber roomType')
        .populate('seatId', 'seatNumber monthlyRentPoisha')
        .lean();

      const [invoices, payments, todayMeal, monthMeals, complaints, leaves, notices] = await Promise.all([
        RentInvoice.find({ residentId: user.linkedResidentId }).sort({ billingMonth: -1 }).lean(),
        Payment.find({ residentId: user.linkedResidentId, isCancelled: false }).sort({ paymentDate: -1 }).lean(),
        MealEntry.findOne({ residentId: user.linkedResidentId, date: todayStr }).lean(),
        MealEntry.find({ residentId: user.linkedResidentId, date: { $regex: `^${currentMonth}` } }).lean(),
        Complaint.find({ residentId: user.linkedResidentId }).sort({ createdAt: -1 }).limit(5).lean(),
        LeaveRequest.find({ residentId: user.linkedResidentId }).sort({ departureDate: -1 }).limit(5).lean(),
        Notification.find({
          $or: [{ recipientUserId: user.id }, { recipientRole: 'RESIDENT' }, { recipientRole: null }],
        }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

      const totalDuesPoisha = invoices.reduce((acc, inv) => acc + (inv.dueAmountPoisha || 0), 0);
      const totalPaidPoisha = payments.reduce((acc, p) => acc + (p.amountPoisha || 0), 0);
      const monthMealUnits = monthMeals.reduce((acc, m) => acc + (m.totalUnits || 0), 0);

      // Latest settlement meal rate
      const latestSettlement = await MonthlyMealSettlement.findOne({ billingMonth: currentMonth }).lean();

      return NextResponse.json({
        success: true,
        role: 'RESIDENT',
        data: {
          resident,
          totalDuesPoisha,
          totalPaidPoisha,
          monthMealUnits: Number(monthMealUnits.toFixed(2)),
          todayMeal: todayMeal || { breakfast: 1, lunch: 1, dinner: 1, totalUnits: 2.5 },
          estimatedMealRatePoisha: latestSettlement?.calculatedMealRatePoisha || 6500, // ৳ 65 default estimate
          recentInvoices: invoices.slice(0, 5),
          recentPayments: payments.slice(0, 5),
          recentComplaints: complaints,
          recentLeaves: leaves,
          notices,
        },
      });
    }

    // 2. MANAGEMENT & OWNER DASHBOARD STATS
    const [
      totalResidents,
      activeResidents,
      onLeaveResidents,
      totalRooms,
      totalSeats,
      occupiedSeats,
      availableSeats,
      reservedSeats,
      maintenanceSeats,
      monthInvoices,
      monthPayments,
      monthExpenses,
      monthBazars,
      todayMeals,
      pendingComplaints,
      pendingLeaves,
      recentAdmissions,
      importantNotices,
      latestSettlement,
    ] = await Promise.all([
      Resident.countDocuments(),
      Resident.countDocuments({ status: 'ACTIVE' }),
      Resident.countDocuments({ status: 'ON_LEAVE' }),
      Room.countDocuments(),
      Seat.countDocuments(),
      Seat.countDocuments({ status: 'OCCUPIED' }),
      Seat.countDocuments({ status: 'AVAILABLE' }),
      Seat.countDocuments({ status: 'RESERVED' }),
      Seat.countDocuments({ status: 'MAINTENANCE' }),
      RentInvoice.find({ billingMonth: currentMonth }).lean(),
      Payment.find({
        isCancelled: false,
        paymentDate: {
          $gte: new Date(`${currentMonth}-01T00:00:00.000Z`),
          $lte: new Date(`${currentMonth}-31T23:59:59.999Z`),
        },
      }).lean(),
      Expense.find({
        expenseDate: {
          $gte: new Date(`${currentMonth}-01T00:00:00.000Z`),
          $lte: new Date(`${currentMonth}-31T23:59:59.999Z`),
        },
      }).lean(),
      BazarPurchase.find({ purchaseDate: { $regex: `^${currentMonth}` } }).lean(),
      MealEntry.find({ date: todayStr }).lean(),
      Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'IN_PROGRESS'] } }),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      Resident.find({ status: 'ACTIVE' })
        .populate('buildingId', 'name')
        .populate('roomId', 'roomNumber')
        .populate('seatId', 'seatNumber')
        .sort({ admissionDate: -1 })
        .limit(5)
        .lean(),
      Notification.find({ type: 'GENERAL_NOTICE' }).sort({ createdAt: -1 }).limit(5).lean(),
      MonthlyMealSettlement.findOne({ billingMonth: currentMonth }).lean(),
    ]);

    // Financial calculations
    const monthlyRentCollectionPoisha = monthPayments
      .filter((p) => p.purpose === 'RENT_INVOICE' || p.purpose === 'ADMISSION_FEE')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const monthlyMealDepositsPoisha = monthPayments
      .filter((p) => p.purpose === 'MEAL_DEPOSIT')
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

    const outstandingRentDuesPoisha = monthInvoices.reduce((acc, inv) => acc + (inv.dueAmountPoisha || 0), 0);

    const totalExpensesPoisha = monthExpenses.reduce((acc, e) => acc + (e.amountPoisha || 0), 0);
    const groceryExpensesPoisha = monthBazars.reduce((acc, b) => acc + (b.totalAmountPoisha || 0), 0);

    // Today's meal stats
    const todayBreakfast = todayMeals.reduce((acc, m) => acc + (m.breakfast || 0) + (m.guestBreakfast || 0), 0);
    const todayLunch = todayMeals.reduce((acc, m) => acc + (m.lunch || 0) + (m.guestLunch || 0), 0);
    const todayDinner = todayMeals.reduce((acc, m) => acc + (m.dinner || 0) + (m.guestDinner || 0), 0);

    // Current meal rate estimate
    const totalMonthMealEntries = await MealEntry.find({ date: { $regex: `^${currentMonth}` } }).lean();
    const totalMonthMealUnits = totalMonthMealEntries.reduce((acc, m) => acc + (m.totalUnits || 0), 0);
    const estimatedMealRatePoisha =
      latestSettlement?.calculatedMealRatePoisha ||
      (totalMonthMealUnits > 0 ? Math.round(groceryExpensesPoisha / totalMonthMealUnits) : 6500);

    // Occupancy rate
    const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

    return NextResponse.json({
      success: true,
      role: user.role,
      data: {
        residents: {
          total: totalResidents,
          active: activeResidents,
          onLeave: onLeaveResidents,
        },
        occupancy: {
          totalRooms,
          totalSeats,
          occupiedSeats,
          availableSeats,
          reservedSeats,
          maintenanceSeats,
          ratePercent: occupancyRate,
        },
        finances: {
          monthlyRentCollectionPoisha,
          monthlyMealDepositsPoisha,
          outstandingRentDuesPoisha,
          totalExpensesPoisha,
          groceryExpensesPoisha,
        },
        meals: {
          todayBreakfast,
          todayLunch,
          todayDinner,
          currentMealRatePoisha: estimatedMealRatePoisha,
        },
        counts: {
          pendingComplaints,
          pendingLeaves,
        },
        recentAdmissions,
        importantNotices,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ড্যাশবোর্ড ডেটা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
