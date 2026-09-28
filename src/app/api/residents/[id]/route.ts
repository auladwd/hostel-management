import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Resident } from '@/models/Resident';
import { Seat } from '@/models/Seat';
import { SeatAllocation } from '@/models/SeatAllocation';
import { RentInvoice } from '@/models/RentInvoice';
import { Payment } from '@/models/Payment';
import { MealEntry } from '@/models/MealEntry';
import { LeaveRequest } from '@/models/LeaveRequest';
import { Complaint } from '@/models/Complaint';
import { requireAuth } from '@/lib/auth/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    await connectToDatabase();

    const { id } = await params;

    const resident = await Resident.findById(id)
      .populate('buildingId', 'name code address')
      .populate('floorId', 'name floorNumber')
      .populate('roomId', 'roomNumber roomType baseRentPoisha')
      .populate('seatId', 'seatNumber monthlyRentPoisha status')
      .lean();

    if (!resident) {
      return NextResponse.json({ success: false, error: 'বর্ডার পাওয়া যায়নি' }, { status: 404 });
    }

    // Role check: Resident can only view their own profile
    if (user.role === 'RESIDENT' && user.linkedResidentId !== resident._id.toString()) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    // Fetch related financial and operational history
    const [invoices, payments, leaveRequests, complaints, allocations, recentMeals] = await Promise.all([
      RentInvoice.find({ residentId: resident._id }).sort({ billingMonth: -1 }).lean(),
      Payment.find({ residentId: resident._id }).sort({ paymentDate: -1 }).lean(),
      LeaveRequest.find({ residentId: resident._id }).sort({ departureDate: -1 }).limit(10).lean(),
      Complaint.find({ residentId: resident._id }).sort({ createdAt: -1 }).limit(10).lean(),
      SeatAllocation.find({ residentId: resident._id })
        .populate('seatId', 'seatNumber')
        .populate('roomId', 'roomNumber')
        .sort({ allocatedFrom: -1 })
        .lean(),
      MealEntry.find({ residentId: resident._id }).sort({ date: -1 }).limit(31).lean(),
    ]);

    // Financial totals
    const totalInvoicedPoisha = invoices.reduce((acc, inv) => acc + (inv.totalPayablePoisha || 0), 0);
    const totalPaidPoisha = payments
      .filter((p) => !p.isCancelled)
      .reduce((acc, p) => acc + (p.amountPoisha || 0), 0);
    const totalDuePoisha = invoices.reduce((acc, inv) => acc + (inv.dueAmountPoisha || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        resident,
        financialSummary: {
          totalInvoicedPoisha,
          totalPaidPoisha,
          totalDuePoisha,
        },
        invoices,
        payments,
        leaveRequests,
        complaints,
        allocations,
        recentMeals,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বর্ডারের তথ্য লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(['OWNER', 'HOSTEL_MANAGER']);
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();

    const updatedResident = await Resident.findByIdAndUpdate(
      id,
      {
        fullName: body.fullName,
        fullNameEn: body.fullNameEn,
        phone: body.phone,
        email: body.email,
        nidOrBirthCert: body.nidOrBirthCert,
        presentAddress: body.presentAddress,
        permanentAddress: body.permanentAddress,
        guardianName: body.guardianName,
        guardianRelation: body.guardianRelation,
        guardianPhone: body.guardianPhone,
        guardianAddress: body.guardianAddress,
        emergencyContactName: body.emergencyContactName,
        emergencyContactRelation: body.emergencyContactRelation,
        emergencyContactPhone: body.emergencyContactPhone,
        institutionOrWorkplace: body.institutionOrWorkplace,
        designationOrDepartment: body.designationOrDepartment,
        idCardNumber: body.idCardNumber,
        bloodGroup: body.bloodGroup,
        photoUrl: body.photoUrl,
        monthlyRentPoisha: body.monthlyRentTaka ? Math.round(Number(body.monthlyRentTaka) * 100) : undefined,
      },
      { new: true }
    );

    if (!updatedResident) {
      return NextResponse.json({ success: false, error: 'বর্ডার পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'বর্ডারের তথ্য সফলভাবে আপডেট করা হয়েছে',
      data: updatedResident,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বর্ডারের তথ্য আপডেট করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
