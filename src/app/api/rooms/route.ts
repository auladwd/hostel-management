import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Room } from '@/models/Room';
import { Seat } from '@/models/Seat';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const buildingId = searchParams.get('buildingId');
    const floorId = searchParams.get('floorId');

    const query: Record<string, unknown> = {};
    if (buildingId) query.buildingId = buildingId;
    if (floorId) query.floorId = floorId;

    const rooms = await Room.find(query)
      .populate('buildingId', 'name code')
      .populate('floorId', 'name floorNumber')
      .sort({ roomNumber: 1 })
      .lean();

    // Fetch seats for each room
    const roomsWithSeats = await Promise.all(
      rooms.map(async (r) => {
        const seats = await Seat.find({ roomId: r._id })
          .populate('currentResidentId', 'fullName residentId phone photoUrl')
          .sort({ seatNumber: 1 })
          .lean();

        const occupiedCount = seats.filter((s) => s.status === 'OCCUPIED').length;
        const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;

        return {
          ...r,
          seats,
          occupiedCount,
          availableCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: roomsWithSeats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'রুমের তথ্য লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const {
      buildingId,
      floorId,
      roomNumber,
      roomType,
      capacity,
      hasAttachedBath,
      hasBalcony,
      hasAirConditioner,
      baseRentTaka,
      notes,
    } = body;

    if (!buildingId || !floorId || !roomNumber) {
      return NextResponse.json(
        { success: false, error: 'ভবন, তলা এবং রুম নম্বর আবশ্যক' },
        { status: 400 }
      );
    }

    const existing = await Room.findOne({ buildingId, roomNumber: roomNumber.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'এই ভবনে এই রুম নম্বরটি ইতিমধ্যে বিদ্যমান' },
        { status: 400 }
      );
    }

    const baseRentPoisha = Math.round((Number(baseRentTaka) || 3500) * 100);
    const roomCapacity = Number(capacity) || 2;

    const room = await Room.create({
      buildingId,
      floorId,
      roomNumber: roomNumber.trim(),
      roomType: roomType || 'DOUBLE',
      capacity: roomCapacity,
      hasAttachedBath: Boolean(hasAttachedBath),
      hasBalcony: Boolean(hasBalcony),
      hasAirConditioner: Boolean(hasAirConditioner),
      baseRentPoisha,
      status: 'ACTIVE',
      notes,
    });

    // Automatically create seats for this room (e.g. Seat-A, Seat-B, or 1, 2)
    const seatLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < roomCapacity; i++) {
      const seatLabel = seatLabels[i] || `${i + 1}`;
      await Seat.create({
        buildingId,
        floorId,
        roomId: room._id,
        seatNumber: `${room.roomNumber}-${seatLabel}`,
        monthlyRentPoisha: baseRentPoisha,
        status: 'AVAILABLE',
      });
    }

    return NextResponse.json({
      success: true,
      message: `রুম ${room.roomNumber} এবং ${roomCapacity}টি সিট সফলভাবে তৈরি করা হয়েছে`,
      data: room,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'রুম তৈরি করা সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
