import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Seat } from '@/models/Seat';
import { SeatAllocation } from '@/models/SeatAllocation';
import { Resident } from '@/models/Resident';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');

    const query: Record<string, unknown> = {};
    if (buildingId) query.buildingId = buildingId;
    if (roomId) query.roomId = roomId;
    if (status) query.status = status;

    const seats = await Seat.find(query)
      .populate('buildingId', 'name code')
      .populate('floorId', 'name floorNumber')
      .populate('roomId', 'roomNumber roomType baseRentPoisha')
      .populate('currentResidentId', 'fullName residentId phone photoUrl')
      .sort({ seatNumber: 1 })
      .lean();

    return NextResponse.json({ success: true, data: seats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সিটের তথ্য লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

/**
 * Seat Allocation, Transfer, or Status Update Action
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const { action, seatId, residentId, targetSeatId, reason, agreedRentTaka, securityDepositTaka, newStatus } = body;

    if (!seatId) {
      return NextResponse.json({ success: false, error: 'সিট আইডি প্রদান করুন' }, { status: 400 });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return NextResponse.json({ success: false, error: 'সিট পাওয়া যায়নি' }, { status: 404 });
    }

    // 1. ALLOCATE SEAT TO RESIDENT
    if (action === 'ALLOCATE') {
      if (!residentId) {
        return NextResponse.json({ success: false, error: 'বর্ডার নির্বাচন করুন' }, { status: 400 });
      }

      if (seat.status !== 'AVAILABLE') {
        return NextResponse.json(
          { success: false, error: 'এই সিটটি ফাঁকা নেই। অন্য সিট নির্বাচন করুন।' },
          { status: 400 }
        );
      }

      const resident = await Resident.findById(residentId);
      if (!resident) {
        return NextResponse.json({ success: false, error: 'বর্ডারের তথ্য পাওয়া যায়নি' }, { status: 404 });
      }

      // Check if resident already has an active seat allocation
      const existingAlloc = await SeatAllocation.findOne({ residentId, status: 'ACTIVE' });
      if (existingAlloc) {
        return NextResponse.json(
          {
            success: false,
            error: 'এই বর্ডার ইতিমধ্যে একটি সিটে বরাদ্দ রয়েছেন। সিট পরিবর্তন করতে ট্রান্সফার অপশন ব্যবহার করুন।',
          },
          { status: 400 }
        );
      }

      const agreedMonthlyRentPoisha = agreedRentTaka
        ? Math.round(Number(agreedRentTaka) * 100)
        : seat.monthlyRentPoisha;
      const securityDepositPoisha = securityDepositTaka
        ? Math.round(Number(securityDepositTaka) * 100)
        : resident.securityDepositPoisha || 0;

      // Create allocation record
      const allocation = await SeatAllocation.create({
        residentId,
        seatId: seat._id,
        roomId: seat.roomId,
        buildingId: seat.buildingId,
        allocatedFrom: new Date(),
        agreedMonthlyRentPoisha,
        securityDepositPoisha,
        status: 'ACTIVE',
        allocatedBy: user.id,
      });

      // Update seat
      seat.status = 'OCCUPIED';
      seat.currentResidentId = resident._id;
      seat.currentAllocationId = allocation._id;
      await seat.save();

      // Update resident record
      resident.buildingId = seat.buildingId;
      resident.roomId = seat.roomId;
      resident.seatId = seat._id;
      resident.monthlyRentPoisha = agreedMonthlyRentPoisha;
      resident.status = 'ACTIVE';
      await resident.save();

      return NextResponse.json({
        success: true,
        message: `${resident.fullName}-কে ${seat.seatNumber} সিট সফলভাবে বরাদ্দ দেওয়া হয়েছে`,
      });
    }

    // 2. TRANSFER RESIDENT TO ANOTHER SEAT
    if (action === 'TRANSFER') {
      if (!targetSeatId) {
        return NextResponse.json({ success: false, error: 'নতুন সিট নির্বাচন করুন' }, { status: 400 });
      }

      const targetSeat = await Seat.findById(targetSeatId);
      if (!targetSeat || targetSeat.status !== 'AVAILABLE') {
        return NextResponse.json({ success: false, error: 'উদ্দিষ্ট সিটটি ফাঁকা নেই' }, { status: 400 });
      }

      const residentIdToTransfer = seat.currentResidentId;
      if (!residentIdToTransfer) {
        return NextResponse.json({ success: false, error: 'এই সিটে কোনো সক্রিয় বর্ডার নেই' }, { status: 400 });
      }

      // Mark current allocation as TRANSFERRED
      await SeatAllocation.updateMany(
        { seatId: seat._id, residentId: residentIdToTransfer, status: 'ACTIVE' },
        {
          status: 'TRANSFERRED',
          actualVacatedDate: new Date(),
          transferredToSeatId: targetSeat._id,
          reasonForVacateOrTransfer: reason || 'সিট পরিবর্তন',
        }
      );

      // Create new allocation on target seat
      const newAlloc = await SeatAllocation.create({
        residentId: residentIdToTransfer,
        seatId: targetSeat._id,
        roomId: targetSeat.roomId,
        buildingId: targetSeat.buildingId,
        allocatedFrom: new Date(),
        agreedMonthlyRentPoisha: targetSeat.monthlyRentPoisha,
        status: 'ACTIVE',
        allocatedBy: user.id,
      });

      // Vacate old seat
      seat.status = 'AVAILABLE';
      seat.currentResidentId = null as any;
      seat.currentAllocationId = null as any;
      await seat.save();

      // Occupy new seat
      targetSeat.status = 'OCCUPIED';
      targetSeat.currentResidentId = residentIdToTransfer;
      targetSeat.currentAllocationId = newAlloc._id;
      await targetSeat.save();

      // Update resident document
      await Resident.findByIdAndUpdate(residentIdToTransfer, {
        buildingId: targetSeat.buildingId,
        roomId: targetSeat.roomId,
        seatId: targetSeat._id,
        monthlyRentPoisha: targetSeat.monthlyRentPoisha,
      });

      return NextResponse.json({
        success: true,
        message: `বর্ডারকে সফলভাবে নতুন সিট ${targetSeat.seatNumber}-এ স্থানান্তর করা হয়েছে`,
      });
    }

    // 3. VACATE SEAT
    if (action === 'VACATE') {
      const activeResidentId = seat.currentResidentId;
      if (activeResidentId) {
        await SeatAllocation.updateMany(
          { seatId: seat._id, residentId: activeResidentId, status: 'ACTIVE' },
          {
            status: 'VACATED',
            actualVacatedDate: new Date(),
            reasonForVacateOrTransfer: reason || 'সিট ত্যাগ',
          }
        );

        await Resident.findByIdAndUpdate(activeResidentId, {
          buildingId: null,
          roomId: null,
          seatId: null,
          status: 'CHECKED_OUT',
          checkoutDate: new Date(),
          checkoutRemarks: reason || 'সিট ত্যাগ করেছেন',
        });
      }

      seat.status = 'AVAILABLE';
      seat.currentResidentId = null as any;
      seat.currentAllocationId = null as any;
      await seat.save();

      return NextResponse.json({
        success: true,
        message: `সিট ${seat.seatNumber} সফলভাবে ফাঁকা করা হয়েছে`,
      });
    }

    // 4. CHANGE STATUS (RESERVED / MAINTENANCE / AVAILABLE)
    if (action === 'SET_STATUS') {
      if (!newStatus || !['AVAILABLE', 'RESERVED', 'MAINTENANCE'].includes(newStatus)) {
        return NextResponse.json({ success: false, error: 'অবৈধ স্ট্যাটাস' }, { status: 400 });
      }

      if (seat.status === 'OCCUPIED') {
        return NextResponse.json(
          { success: false, error: 'বরাদ্দকৃত সিটের স্ট্যাটাস সরাসরি পরিবর্তন করা যাবে না' },
          { status: 400 }
        );
      }

      seat.status = newStatus;
      await seat.save();

      return NextResponse.json({
        success: true,
        message: 'সিট স্ট্যাটাস আপডেট করা হয়েছে',
      });
    }

    return NextResponse.json({ success: false, error: 'অকার্যকর অ্যাকশন' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'সিট অপারেশন ব্যর্থ হয়েছে';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
