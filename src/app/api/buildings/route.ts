import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Building } from '@/models/Building';
import { Floor } from '@/models/Floor';
import { Room } from '@/models/Room';
import { Seat } from '@/models/Seat';
import { requireAuth } from '@/lib/auth/server';

export async function GET() {
  try {
    await requireAuth();
    await connectToDatabase();

    const buildings = await Building.find().sort({ createdAt: 1 }).lean();

    // Enrich buildings with floor, room, and seat statistics
    const enrichedBuildings = await Promise.all(
      buildings.map(async (b) => {
        const floorsCount = await Floor.countDocuments({ buildingId: b._id });
        const roomsCount = await Room.countDocuments({ buildingId: b._id });
        const totalSeats = await Seat.countDocuments({ buildingId: b._id });
        const occupiedSeats = await Seat.countDocuments({ buildingId: b._id, status: 'OCCUPIED' });
        const availableSeats = await Seat.countDocuments({ buildingId: b._id, status: 'AVAILABLE' });

        return {
          ...b,
          floorsCount,
          roomsCount,
          totalSeats,
          occupiedSeats,
          availableSeats,
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedBuildings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ভবনের তথ্য লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const { name, code, totalFloors, address, caretakerName, caretakerPhone } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'ভবনের নাম এবং কোড আবশ্যক' },
        { status: 400 }
      );
    }

    const existing = await Building.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'এই কোড দিয়ে ইতিমধ্যে একটি ভবন বিদ্যমান রয়েছে' },
        { status: 400 }
      );
    }

    const building = await Building.create({
      name,
      code: code.toUpperCase().trim(),
      totalFloors: Number(totalFloors) || 1,
      address,
      caretakerName,
      caretakerPhone,
    });

    // Auto-create floors for convenience
    const floorsCount = Number(totalFloors) || 1;
    for (let f = 1; f <= floorsCount; f++) {
      const bnFloorNames = ['নিচতলা', '১ম তলা', '২য় তলা', '৩য় তলা', '৪র্থ তলা', '৫ম তলা', '৬ষ্ঠ তলা', '৭ম তলা', '৮ম তলা', '৯ম তলা', '১০ম তলা'];
      const floorName = bnFloorNames[f] || `${f}ম তলা`;
      await Floor.create({
        buildingId: building._id,
        floorNumber: f,
        name: floorName,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'নতুন ভবন ও তলা সফলভাবে যুক্ত করা হয়েছে',
      data: building,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'ভবন যুক্ত করা সম্ভব হয়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
