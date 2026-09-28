import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { MealEntry } from '@/models/MealEntry';
import { Resident } from '@/models/Resident';
import { Settings } from '@/models/Settings';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // "YYYY-MM-DD"
    const month = searchParams.get('month'); // "YYYY-MM"
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

    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${month}` };
    }

    const meals = await MealEntry.find(query)
      .populate('residentId', 'fullName residentId phone photoUrl')
      .populate({
        path: 'residentId',
        populate: [
          { path: 'roomId', select: 'roomNumber' },
          { path: 'seatId', select: 'seatNumber' },
        ],
      })
      .sort({ date: -1 })
      .lean();

    // Calculate aggregated totals for the day or month
    const totalBreakfast = meals.reduce((acc, m) => acc + (m.breakfast || 0) + (m.guestBreakfast || 0), 0);
    const totalLunch = meals.reduce((acc, m) => acc + (m.lunch || 0) + (m.guestLunch || 0), 0);
    const totalDinner = meals.reduce((acc, m) => acc + (m.dinner || 0) + (m.guestDinner || 0), 0);
    const grandTotalUnits = meals.reduce((acc, m) => acc + (m.totalUnits || 0), 0);

    return NextResponse.json({
      success: true,
      data: meals,
      summary: {
        totalBreakfast,
        totalLunch,
        totalDinner,
        grandTotalUnits,
        totalRecords: meals.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'মিল রেকর্ড লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Update or record meal for a resident
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const body = await req.json();
    const {
      residentId,
      date, // "YYYY-MM-DD"
      breakfast,
      lunch,
      dinner,
      guestBreakfast,
      guestLunch,
      guestDinner,
      notes,
    } = body;

    const targetResidentId = user.role === 'RESIDENT' ? user.linkedResidentId : residentId;

    if (!targetResidentId || !date) {
      return NextResponse.json(
        { success: false, error: 'বর্ডার এবং তারিখ প্রদান করুন' },
        { status: 400 }
      );
    }

    const settings = await Settings.findOne().lean();
    const weights = settings?.mealWeights || { breakfast: 0.5, lunch: 1.0, dinner: 1.0 };

    // Check Cutoff enforcement if regular resident is modifying
    if (user.role === 'RESIDENT') {
      const now = new Date();
      // Format now to Asia/Dhaka YYYY-MM-DD and HH:mm
      const dhakaDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
      const [currentHour, currentMinute] = now
        .toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour12: false })
        .split(':')
        .map(Number);
      const currentTimeInMins = currentHour * 60 + currentMinute;

      // If target date is in the past, disallow editing
      if (date < dhakaDateStr) {
        return NextResponse.json(
          { success: false, error: 'অতীতের দিনের মিল পরিবর্তন করা যাবে না' },
          { status: 400 }
        );
      }

      // If target date is today, check individual cutoffs
      if (date === dhakaDateStr) {
        const [dinnerH, dinnerM] = (settings?.mealCutoffDinner || '16:00').split(':').map(Number);
        const [lunchH, lunchM] = (settings?.mealCutoffLunch || '09:00').split(':').map(Number);

        if (currentTimeInMins > lunchH * 60 + lunchM && lunch !== undefined) {
          return NextResponse.json(
            { success: false, error: `দুপুরের মিল পরিবর্তনের নির্ধারিত সময় (${settings?.mealCutoffLunch || '09:00'}) পার হয়ে গেছে` },
            { status: 400 }
          );
        }

        if (currentTimeInMins > dinnerH * 60 + dinnerM && dinner !== undefined) {
          return NextResponse.json(
            { success: false, error: `রাতের মিল পরিবর্তনের নির্ধারিত সময় (${settings?.mealCutoffDinner || '16:00'}) পার হয়ে গেছে` },
            { status: 400 }
          );
        }
      }
    }

    const b = Number(breakfast ?? 1);
    const l = Number(lunch ?? 1);
    const d = Number(dinner ?? 1);
    const gb = Number(guestBreakfast ?? 0);
    const gl = Number(guestLunch ?? 0);
    const gd = Number(guestDinner ?? 0);

    const totalUnits =
      (b + gb) * weights.breakfast +
      (l + gl) * weights.lunch +
      (d + gd) * weights.dinner;

    const mealEntry = await MealEntry.findOneAndUpdate(
      { residentId: targetResidentId, date },
      {
        residentId: targetResidentId,
        date,
        breakfast: b,
        lunch: l,
        dinner: d,
        guestBreakfast: gb,
        guestLunch: gl,
        guestDinner: gd,
        totalUnits,
        status: b === 0 && l === 0 && d === 0 && gb === 0 && gl === 0 && gd === 0
          ? 'CANCELLED_BY_RESIDENT'
          : 'ACTIVE',
        notes: notes || '',
        updatedBy: user.id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `${date} তারিখের মিল সফলভাবে সংরক্ষিত হয়েছে (${totalUnits} ইউনিট)`,
      data: mealEntry,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'মিল আপডেট করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
