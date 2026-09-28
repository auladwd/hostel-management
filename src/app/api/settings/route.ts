import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    await connectToDatabase();

    let settings = await Settings.findOne().lean();
    if (!settings) {
      settings = await Settings.create({
        hostelName: 'গ্রিন ভিউ বয়েজ হোস্টেল ও মেস',
        hostelNameEn: 'Green View Boys Hostel & Mess',
        tagline: 'একটি নিরাপদ, সুশৃঙ্খল ও আন্তরিক আবাসিক পরিবেশ',
        address: 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
        phone: '+৮৮০১৭১২৩৪৫৬৭৮',
        email: 'contact@hostel.example.com',
        activeMode: 'COMBINED',
        currency: 'BDT',
        currencySymbol: '৳',
        rentDueDay: 5,
        lateFeePoisha: 10000,
        mealCutoffBreakfast: '22:00',
        mealCutoffLunch: '09:00',
        mealCutoffDinner: '16:00',
        mealWeights: { breakfast: 0.5, lunch: 1.0, dinner: 1.0 },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সেটিংস লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER']);
    await connectToDatabase();

    const body = await req.json();

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (body.hostelName) settings.hostelName = body.hostelName.trim();
    if (body.hostelNameEn !== undefined) settings.hostelNameEn = body.hostelNameEn.trim();
    if (body.tagline !== undefined) settings.tagline = body.tagline.trim();
    if (body.logoUrl !== undefined) settings.logoUrl = body.logoUrl;
    if (body.address) settings.address = body.address.trim();
    if (body.phone) settings.phone = body.phone.trim();
    if (body.email) settings.email = body.email.trim();
    if (body.activeMode) settings.activeMode = body.activeMode;
    if (body.rentDueDay) settings.rentDueDay = Number(body.rentDueDay);
    if (body.lateFeeTaka !== undefined) settings.lateFeePoisha = Math.round(Number(body.lateFeeTaka) * 100);
    if (body.mealCutoffBreakfast) settings.mealCutoffBreakfast = body.mealCutoffBreakfast;
    if (body.mealCutoffLunch) settings.mealCutoffLunch = body.mealCutoffLunch;
    if (body.mealCutoffDinner) settings.mealCutoffDinner = body.mealCutoffDinner;
    if (body.mealWeights) {
      settings.mealWeights = {
        breakfast: Number(body.mealWeights.breakfast) || 0.5,
        lunch: Number(body.mealWeights.lunch) || 1.0,
        dinner: Number(body.mealWeights.dinner) || 1.0,
      };
    }
    if (body.rulesAndPolicies !== undefined) settings.rulesAndPolicies = body.rulesAndPolicies;

    settings.updatedBy = user.id as any;
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'হোস্টেল সেটিংস ও পলিসি সফলভাবে সংরক্ষিত হয়েছে',
      data: settings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সেটিংস আপডেট করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
