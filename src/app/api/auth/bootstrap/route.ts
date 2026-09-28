import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Settings } from '@/models/Settings';
import { AuditLog } from '@/models/AuditLog';

export async function POST(req: NextRequest) {
  try {
    const { secret, email, displayName, hostelName, address, phone } = await req.json();

    const expectedSecret = process.env.BOOTSTRAP_SECRET || process.env.SYSTEM_BOOTSTRAP_KEY;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'অবৈধ বুটস্ট্র্যাপ সিক্রেট কি (Invalid bootstrap secret)' },
        { status: 403 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'মালিকের ইমেইল অ্যাড্রেস আবশ্যক' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if an OWNER already exists
    const existingOwner = await User.findOne({ role: 'OWNER' });
    if (existingOwner && existingOwner.email !== email.toLowerCase().trim()) {
      return NextResponse.json(
        {
          success: false,
          error: `ইতিমধ্যে একজন প্রধান মালিক (${existingOwner.email}) সক্রিয় রয়েছে। নতুন মালিক তৈরি করতে সেটিংস থেকে পরিবর্তন করুন।`,
        },
        { status: 400 }
      );
    }

    let ownerUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!ownerUser) {
      ownerUser = await User.create({
        firebaseUid: `bootstrap-owner-${Date.now()}`,
        email: email.toLowerCase().trim(),
        displayName: displayName || 'প্রধান প্রশাসক ও মালিক',
        role: 'OWNER',
        status: 'ACTIVE',
      });
    } else {
      ownerUser.role = 'OWNER';
      ownerUser.status = 'ACTIVE';
      await ownerUser.save();
    }

    // Initialize or update default settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        hostelName: hostelName || 'গ্রিন ভিউ বয়েজ হোস্টেল ও মেস',
        address: address || 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা',
        phone: phone || '+৮৮০১৭১২৩৪৫৬৭৮',
        email: email.toLowerCase().trim(),
        activeMode: 'COMBINED',
        updatedBy: ownerUser._id,
      });
    }

    // Record audit log
    await AuditLog.create({
      action: 'SYSTEM_BOOTSTRAP',
      entity: 'User',
      entityId: ownerUser._id.toString(),
      performedByUserId: ownerUser._id,
      performedByEmail: ownerUser.email,
      performedByRole: 'OWNER',
      details: {
        message: 'সিস্টেম সফলভাবে ইনিশিয়ালাইজ ও মালিক কনফিগার করা হয়েছে।',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'হোস্টেল সিস্টেম এবং মালিক অ্যাকাউন্ট সফলভাবে ইনিশিয়ালাইজ করা হয়েছে।',
      owner: {
        id: ownerUser._id.toString(),
        email: ownerUser.email,
        displayName: ownerUser.displayName,
        role: ownerUser.role,
      },
    });
  } catch (error: unknown) {
    console.error('Bootstrap Error:', error);
    const message = error instanceof Error ? error.message : 'বুটস্ট্র্যাপ ব্যর্থ হয়েছে';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
