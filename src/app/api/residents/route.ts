import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Resident } from '@/models/Resident';
import { Seat } from '@/models/Seat';
import { SeatAllocation } from '@/models/SeatAllocation';
import { Settings } from '@/models/Settings';
import { Payment } from '@/models/Payment';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const buildingId = searchParams.get('buildingId');
    const roomId = searchParams.get('roomId');

    const query: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (buildingId) query.buildingId = buildingId;
    if (roomId) query.roomId = roomId;

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        { residentId: searchRegex },
        { institutionOrWorkplace: searchRegex },
        { nidOrBirthCert: searchRegex },
      ];
    }

    const residents = await Resident.find(query)
      .populate('buildingId', 'name code')
      .populate('roomId', 'roomNumber roomType')
      .populate('seatId', 'seatNumber monthlyRentPoisha')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: residents });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বর্ডার তালিকা লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const {
      fullName,
      fullNameEn,
      phone,
      email,
      nidOrBirthCert,
      documentType,
      documentUrl,
      dateOfBirth,
      bloodGroup,
      gender,
      presentAddress,
      permanentAddress,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianAddress,
      emergencyContactName,
      emergencyContactRelation,
      emergencyContactPhone,
      institutionOrWorkplace,
      designationOrDepartment,
      idCardNumber,
      photoUrl,
      photoPublicId,
      seatId,
      admissionDate,
      monthlyRentTaka,
      securityDepositTaka,
      admissionFeeTaka,
      paymentMethod,
      transactionId,
    } = body;

    if (!fullName || !phone || !nidOrBirthCert || !guardianName || !guardianPhone || !presentAddress || !permanentAddress) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন' },
        { status: 400 }
      );
    }

    // Check if phone or NID is already registered
    const existing = await Resident.findOne({
      $or: [{ phone: phone.trim() }, { nidOrBirthCert: nidOrBirthCert.trim() }],
      status: { $in: ['ACTIVE', 'ON_LEAVE'] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'এই মোবাইল নম্বর বা এনআইডি দিয়ে ইতিমধ্যে একজন সক্রিয় বর্ডার নিবন্ধিত রয়েছে' },
        { status: 400 }
      );
    }

    // Generate Unique Resident ID
    const settings = await Settings.findOne().lean();
    const prefix = settings?.residentIdPrefix || 'HST';
    const year = new Date().getFullYear();
    const count = await Resident.countDocuments();
    const residentIdCode = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;

    const monthlyRentPoisha = Math.round((Number(monthlyRentTaka) || 3500) * 100);
    const securityDepositPoisha = Math.round((Number(securityDepositTaka) || 0) * 100);
    const admissionFeePoisha = Math.round((Number(admissionFeeTaka) || 0) * 100);

    // If seat is selected, verify availability
    let seat = null;
    if (seatId) {
      seat = await Seat.findById(seatId);
      if (!seat || seat.status !== 'AVAILABLE') {
        return NextResponse.json(
          { success: false, error: 'নির্বাচিত সিটটি ফাঁকা নেই' },
          { status: 400 }
        );
      }
    }

    const resident = await Resident.create({
      residentId: residentIdCode,
      fullName: fullName.trim(),
      fullNameEn: fullNameEn?.trim(),
      phone: phone.trim(),
      email: email?.trim()?.toLowerCase(),
      nidOrBirthCert: nidOrBirthCert.trim(),
      documentType: documentType || 'NID',
      documentUrl,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      bloodGroup,
      gender: gender || 'MALE',
      presentAddress,
      permanentAddress,
      guardianName,
      guardianRelation,
      guardianPhone,
      guardianAddress,
      emergencyContactName: emergencyContactName || guardianName,
      emergencyContactRelation: emergencyContactRelation || guardianRelation,
      emergencyContactPhone: emergencyContactPhone || guardianPhone,
      institutionOrWorkplace,
      designationOrDepartment,
      idCardNumber,
      photoUrl,
      photoPublicId,
      buildingId: seat?.buildingId || undefined,
      roomId: seat?.roomId || undefined,
      seatId: seat?._id || undefined,
      admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
      monthlyRentPoisha: seat ? seat.monthlyRentPoisha : monthlyRentPoisha,
      securityDepositPoisha,
      status: 'ACTIVE',
      createdById: user.id as any,
    }) as any;

    // If seat assigned, create allocation and mark seat occupied
    if (seat) {
      const alloc = await SeatAllocation.create({
        residentId: resident._id,
        seatId: seat._id,
        roomId: seat.roomId,
        buildingId: seat.buildingId,
        allocatedFrom: resident.admissionDate,
        agreedMonthlyRentPoisha: seat.monthlyRentPoisha,
        securityDepositPoisha,
        status: 'ACTIVE',
        allocatedBy: user.id,
      });

      seat.status = 'OCCUPIED';
      seat.currentResidentId = resident._id;
      seat.currentAllocationId = alloc._id;
      await seat.save();
    }

    // Record initial deposit / admission fee payment if provided
    const initialPaidPoisha = securityDepositPoisha + admissionFeePoisha;
    if (initialPaidPoisha > 0 && paymentMethod) {
      const receiptCount = await Payment.countDocuments();
      const receiptNumber = `${settings?.receiptPrefix || 'RCT'}-${year}-${String(receiptCount + 1).padStart(5, '0')}`;

      await Payment.create({
        receiptNumber,
        residentId: resident._id,
        purpose: securityDepositPoisha > 0 ? 'SECURITY_DEPOSIT' : 'ADMISSION_FEE',
        amountPoisha: initialPaidPoisha,
        paymentMethod: paymentMethod || 'CASH',
        transactionId: transactionId || '',
        paymentDate: new Date(),
        collectedBy: user.id,
        remarks: `ভর্তিকালীন জামানত ও ভর্তি ফি (আইডি: ${resident.residentId})`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `বর্ডার ${resident.fullName} সফলভাবে ভর্তি সম্পন্ন হয়েছে (আইডি: ${resident.residentId})`,
      data: resident,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বর্ডার ভর্তি সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
