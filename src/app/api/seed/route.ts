import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Building } from '@/models/Building';
import { Floor } from '@/models/Floor';
import { Room } from '@/models/Room';
import { Seat } from '@/models/Seat';
import { SeatAllocation } from '@/models/SeatAllocation';
import { Resident } from '@/models/Resident';
import { RentInvoice } from '@/models/RentInvoice';
import { Payment } from '@/models/Payment';
import { MealEntry } from '@/models/MealEntry';
import { BazarPurchase } from '@/models/BazarPurchase';
import { Expense } from '@/models/Expense';
import { Complaint } from '@/models/Complaint';
import { Staff } from '@/models/Staff';
import { Settings } from '@/models/Settings';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    // Only allow seeding in development or with bootstrap secret
    const { secret } = await req.json().catch(() => ({}));
    if (process.env.NODE_ENV !== 'development' && secret !== process.env.BOOTSTRAP_SECRET) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত রিকোয়েস্ট' }, { status: 403 });
    }

    await connectToDatabase();

    // 1. Settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        hostelName: 'গ্রিন ভিউ বয়েজ হোস্টেল ও মেস',
        hostelNameEn: 'Green View Boys Hostel & Mess',
        tagline: 'একটি সুশৃঙ্খল, নিরাপদ ও পারিবারিক পরিবেশ',
        address: 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
        phone: '+৮৮০১৭৮৭৬৫৪৩২১',
        email: 'info@greenviewhostel.bd',
        activeMode: 'COMBINED',
        currency: 'BDT',
        currencySymbol: '৳',
        rentDueDay: 5,
        lateFeePoisha: 10000,
        securityDepositPoisha: 300000,
        mealCutoffBreakfast: '22:00',
        mealCutoffLunch: '09:00',
        mealCutoffDinner: '16:00',
        mealWeights: { breakfast: 0.5, lunch: 1.0, dinner: 1.0 },
      });
    }

    // 2. Default Owner User
    let owner = await User.findOne({ role: 'OWNER' });
    if (!owner) {
      owner = await User.create({
        firebaseUid: 'seed-owner-uid',
        email: process.env.INITIAL_OWNER_EMAIL || 'owner@hostel.example.com',
        displayName: 'আওলাদ হোসেন (মালিক)',
        role: 'OWNER',
        status: 'ACTIVE',
      });
    }

    // Check if buildings already exist
    const buildingCount = await Building.countDocuments();
    if (buildingCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'ডেটাবেজে ইতিমধ্যে তথ্য রয়েছে। নতুন করে সিড করার প্রয়োজন নেই।',
      });
    }

    // 3. Buildings & Floors
    const bldA = await Building.create({
      name: 'প্রধান ভবন (নিলয়)',
      code: 'BLD-A',
      totalFloors: 3,
      address: 'ধানমন্ডি ৫/এ, ঢাকা',
      caretakerName: 'রফিকুল ইসলাম',
      caretakerPhone: '০১৭০০০০০০০১',
      status: 'ACTIVE',
    });

    const floor1 = await Floor.create({ buildingId: bldA._id, floorNumber: 1, name: '১ম তলা' });
    const floor2 = await Floor.create({ buildingId: bldA._id, floorNumber: 2, name: '২য় তলা' });

    // 4. Rooms
    const room101 = await Room.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomNumber: '১০১',
      roomType: 'DOUBLE',
      capacity: 2,
      hasAttachedBath: true,
      hasBalcony: true,
      hasAirConditioner: false,
      baseRentPoisha: 400000, // ৳ 4,000
      status: 'ACTIVE',
    });

    const room102 = await Room.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomNumber: '১০২',
      roomType: 'TRIPLE',
      capacity: 3,
      hasAttachedBath: false,
      hasBalcony: false,
      hasAirConditioner: false,
      baseRentPoisha: 320000, // ৳ 3,200
      status: 'ACTIVE',
    });

    const room201 = await Room.create({
      buildingId: bldA._id,
      floorId: floor2._id,
      roomNumber: '২০১',
      roomType: 'DOUBLE',
      capacity: 2,
      hasAttachedBath: true,
      hasBalcony: true,
      hasAirConditioner: true,
      baseRentPoisha: 550000, // ৳ 5,500
      status: 'ACTIVE',
    });

    // 5. Seats
    const seat101A = await Seat.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomId: room101._id,
      seatNumber: '১০১-A',
      monthlyRentPoisha: 400000,
      status: 'AVAILABLE',
    });

    const seat101B = await Seat.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomId: room101._id,
      seatNumber: '১০১-B',
      monthlyRentPoisha: 400000,
      status: 'AVAILABLE',
    });

    const seat102A = await Seat.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomId: room102._id,
      seatNumber: '১০২-A',
      monthlyRentPoisha: 320000,
      status: 'AVAILABLE',
    });

    const seat102B = await Seat.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomId: room102._id,
      seatNumber: '১০২-B',
      monthlyRentPoisha: 320000,
      status: 'AVAILABLE',
    });

    const seat102C = await Seat.create({
      buildingId: bldA._id,
      floorId: floor1._id,
      roomId: room102._id,
      seatNumber: '১০২-C',
      monthlyRentPoisha: 320000,
      status: 'AVAILABLE',
    });

    const seat201A = await Seat.create({
      buildingId: bldA._id,
      floorId: floor2._id,
      roomId: room201._id,
      seatNumber: '২০১-A',
      monthlyRentPoisha: 550000,
      status: 'AVAILABLE',
    });

    const seat201B = await Seat.create({
      buildingId: bldA._id,
      floorId: floor2._id,
      roomId: room201._id,
      seatNumber: '২০১-B',
      monthlyRentPoisha: 550000,
      status: 'AVAILABLE',
    });

    // 6. Sample Residents
    const res1 = await Resident.create({
      residentId: 'HST-2026-0001',
      fullName: 'তানভীর আহমেদ',
      fullNameEn: 'Tanvir Ahmed',
      phone: '০১৭৮৯১২৩৪৫৬',
      email: 'tanvir@student.example.com',
      nidOrBirthCert: '১৯৯৮২৬৯১২২৩০০০০০১',
      documentType: 'NID',
      presentAddress: 'রুম ১০১, গ্রিন ভিউ হোস্টেল, ধানমন্ডি, ঢাকা',
      permanentAddress: 'গ্রাম: কৃষ্ণপুর, ডাকঘর: ফুলবাড়ী, দিনাজপুর',
      guardianName: 'মো: মোজাম্মেল হক',
      guardianRelation: 'পিতা',
      guardianPhone: '০১৭৫০০০০০০১',
      emergencyContactName: 'মো: মোজাম্মেল হক',
      emergencyContactRelation: 'পিতা',
      emergencyContactPhone: '০১৭৫০০০০০০১',
      institutionOrWorkplace: 'ঢাকা বিশ্ববিদ্যালয় (সিএসই বিভাগ)',
      idCardNumber: 'DU-CSE-2022-45',
      admissionDate: new Date('2026-01-01'),
      buildingId: bldA._id,
      roomId: room101._id,
      seatId: seat101A._id,
      monthlyRentPoisha: 400000,
      securityDepositPoisha: 300000,
      status: 'ACTIVE',
    });

    // Allocate seat 101-A
    seat101A.status = 'OCCUPIED';
    seat101A.currentResidentId = res1._id;
    await seat101A.save();

    await SeatAllocation.create({
      residentId: res1._id,
      seatId: seat101A._id,
      roomId: room101._id,
      buildingId: bldA._id,
      allocatedFrom: new Date('2026-01-01'),
      agreedMonthlyRentPoisha: 400000,
      securityDepositPoisha: 300000,
      status: 'ACTIVE',
      allocatedBy: owner._id,
    });

    const res2 = await Resident.create({
      residentId: 'HST-2026-0002',
      fullName: 'সাকিব আল হাসান',
      fullNameEn: 'Sakib Al Hasan',
      phone: '০১৮১২৩৪৫৬৭৮',
      email: 'sakib@techcorp.example.com',
      nidOrBirthCert: '২০০১১৯৮৭৬৫৪০০০০২',
      documentType: 'NID',
      presentAddress: 'রুম ১০২, গ্রিন ভিউ হোস্টেল, ধানমন্ডি, ঢাকা',
      permanentAddress: 'থানা রোড, মাগুরা সদর, মাগুরা',
      guardianName: 'খন্দকার মাসরুর রেজা',
      guardianRelation: 'পিতা',
      guardianPhone: '০১৮২০০০১১২২',
      emergencyContactName: 'খন্দকার মাসরুর রেজা',
      emergencyContactRelation: 'পিতা',
      emergencyContactPhone: '০১৮২০০০১১২২',
      institutionOrWorkplace: 'ব্রেইন স্টেশন ২৩ (সফটওয়্যার ইঞ্জিনিয়ার)',
      designationOrDepartment: 'Software Engineer',
      admissionDate: new Date('2026-02-01'),
      buildingId: bldA._id,
      roomId: room102._id,
      seatId: seat102A._id,
      monthlyRentPoisha: 320000,
      securityDepositPoisha: 300000,
      status: 'ACTIVE',
    });

    // Allocate seat 102-A
    seat102A.status = 'OCCUPIED';
    seat102A.currentResidentId = res2._id;
    await seat102A.save();

    await SeatAllocation.create({
      residentId: res2._id,
      seatId: seat102A._id,
      roomId: room102._id,
      buildingId: bldA._id,
      allocatedFrom: new Date('2026-02-01'),
      agreedMonthlyRentPoisha: 320000,
      securityDepositPoisha: 300000,
      status: 'ACTIVE',
      allocatedBy: owner._id,
    });

    // 7. Sample Invoices & Payments
    const currentMonth = new Date().toISOString().substring(0, 7);
    const inv1 = await RentInvoice.create({
      invoiceNumber: `INV-${currentMonth.replace('-', '')}-00001`,
      residentId: res1._id,
      billingMonth: currentMonth,
      roomRentPoisha: 400000,
      utilityChargesPoisha: 50000, // ৳ 500
      serviceChargesPoisha: 20000, // ৳ 200
      totalPayablePoisha: 470000,
      paidAmountPoisha: 470000,
      dueAmountPoisha: 0,
      status: 'PAID',
      dueDate: new Date(),
      generatedBy: owner._id,
      notes: `${currentMonth} মাসের মাসিক হোস্টেল ভাড়া ও ইউটিলিটি বিল`,
    });

    await Payment.create({
      receiptNumber: `RCT-2026-00001`,
      residentId: res1._id,
      invoiceId: inv1._id,
      purpose: 'RENT_INVOICE',
      amountPoisha: 470000,
      paymentMethod: 'BKASH',
      transactionId: 'BKASH98712365',
      paymentDate: new Date(),
      collectedBy: owner._id,
      remarks: 'বিকাশের মাধ্যমে পরিশোধিত',
    });

    const inv2 = await RentInvoice.create({
      invoiceNumber: `INV-${currentMonth.replace('-', '')}-00002`,
      residentId: res2._id,
      billingMonth: currentMonth,
      roomRentPoisha: 320000,
      utilityChargesPoisha: 50000,
      serviceChargesPoisha: 20000,
      totalPayablePoisha: 390000,
      paidAmountPoisha: 200000,
      dueAmountPoisha: 190000,
      status: 'PARTIAL',
      dueDate: new Date(),
      generatedBy: owner._id,
      notes: `${currentMonth} মাসের মাসিক হোস্টেল ভাড়া`,
    });

    await Payment.create({
      receiptNumber: `RCT-2026-00002`,
      residentId: res2._id,
      invoiceId: inv2._id,
      purpose: 'RENT_INVOICE',
      amountPoisha: 200000,
      paymentMethod: 'CASH',
      paymentDate: new Date(),
      collectedBy: owner._id,
      remarks: 'নগদ ক্যাশ আংশিক পরিশোধ',
    });

    // Advance Meal Deposit for resident 1
    await Payment.create({
      receiptNumber: `RCT-2026-00003`,
      residentId: res1._id,
      purpose: 'MEAL_DEPOSIT',
      amountPoisha: 300000, // ৳ 3,000
      paymentMethod: 'NAGAD',
      transactionId: 'NGD77665544',
      paymentDate: new Date(),
      collectedBy: owner._id,
      remarks: `${currentMonth} মাসের মিল বাবদ অগ্রিম জমা`,
    });

    // 8. Sample Bazar Entry
    await BazarPurchase.create({
      voucherNumber: 'BZR-2026-00001',
      purchaseDate: new Date().toISOString().substring(0, 10),
      category: 'GROCERY',
      items: [
        { itemName: 'মিনিকেট চাল', quantity: 25, unit: 'কেজি', unitPricePoisha: 7200, totalPricePoisha: 180000 },
        { itemName: 'সয়াবিন তেল', quantity: 5, unit: 'লিটার', unitPricePoisha: 18500, totalPricePoisha: 92500 },
        { itemName: 'মসুর ডাল', quantity: 3, unit: 'কেজি', unitPricePoisha: 13000, totalPricePoisha: 39000 },
        { itemName: 'পেঁয়াজ ও রসুন', quantity: 4, unit: 'কেজি', unitPricePoisha: 8500, totalPricePoisha: 34000 },
      ],
      totalAmountPoisha: 345500, // ৳ 3,455
      purchasedBy: 'মো: আলাউদ্দিন (বাবুর্চি)',
      isApproved: true,
      approvedBy: owner._id,
      notes: 'সাপ্তাহিক প্রধান মুদি বাজার সম্পন্ন',
    });

    // 9. Sample Today's Meals
    const todayStr = new Date().toISOString().substring(0, 10);
    await MealEntry.create({
      residentId: res1._id,
      date: todayStr,
      breakfast: 1,
      lunch: 1,
      dinner: 1,
      totalUnits: 2.5,
      status: 'ACTIVE',
    });

    await MealEntry.create({
      residentId: res2._id,
      date: todayStr,
      breakfast: 0,
      lunch: 1,
      dinner: 1,
      totalUnits: 2.0,
      status: 'ACTIVE',
    });

    // 10. Sample Staff
    await Staff.create({
      staffId: 'STF-001',
      fullName: 'মো: আলাউদ্দিন',
      phone: '০১৭৭০০০০০২২',
      role: 'COOK',
      nid: '১৯৮২১২৩৪৫৬৭৮৯০',
      monthlySalaryPoisha: 1600000, // ৳ 16,000
      emergencyContact: '০১৭৭০০০০০২৩',
      responsibilities: 'প্রতিদিনের তিন বেলা রান্না ও কিচেনের পরিচ্ছন্নতা',
      status: 'ACTIVE',
    });

    await Staff.create({
      staffId: 'STF-002',
      fullName: 'কামরুল হাসান',
      phone: '০১৮৮০০০০০৩৩',
      role: 'HOSTEL_MANAGER',
      nid: '১৯৯০১২৩৪৫৬৭৮৯১',
      monthlySalaryPoisha: 2000000, // ৳ 20,000
      emergencyContact: '০১৮৮০০০০০৩৪',
      responsibilities: 'দৈনিক হোস্টেল তত্ত্বাবধান ও রেজিস্টার সংরক্ষণ',
      status: 'ACTIVE',
    });

    // 11. Sample Complaint
    await Complaint.create({
      ticketNumber: 'CMP-2026-0001',
      residentId: res2._id,
      category: 'WATER_SUPPLY',
      title: '১০২ নম্বর রুমের ওয়াশরুমের বেসিন ট্যাপ দিয়ে পানি পড়ছে',
      description: 'বেসিনের ট্যাপটি ঢিলে হয়ে গেছে এবং অবিরাম পানি ড্রপ করছে। অনুগ্রহ করে মেরামত করে দিন।',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      resolutionNotes: 'প্লাম্বারকে জানানো হয়েছে, আজ বিকেলে ঠিক করা হবে।',
    });

    return NextResponse.json({
      success: true,
      message: 'হোস্টেল ও মেসের প্রাথমিক ডেমো ডেটা সফলভাবে ডেটাবেজে যুক্ত করা হয়েছে।',
    });
  } catch (error: unknown) {
    console.error('Seed Error:', error);
    const message = error instanceof Error ? error.message : 'সিড সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
