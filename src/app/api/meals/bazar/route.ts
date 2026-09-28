import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { BazarPurchase } from '@/models/BazarPurchase';
import { requireAuth } from '@/lib/auth/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM"
    const date = searchParams.get('date'); // "YYYY-MM-DD"
    const category = searchParams.get('category');

    const query: Record<string, unknown> = {};

    if (date) {
      query.purchaseDate = date;
    } else if (month) {
      query.purchaseDate = { $regex: `^${month}` };
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    const purchases = await BazarPurchase.find(query)
      .populate('approvedBy', 'displayName role')
      .populate('purchasedByResidentId', 'fullName residentId phone')
      .sort({ purchaseDate: -1, createdAt: -1 })
      .lean();

    const totalBazarPoisha = purchases.reduce((acc, p) => acc + (p.totalAmountPoisha || 0), 0);

    return NextResponse.json({
      success: true,
      data: purchases,
      summary: {
        totalBazarPoisha,
        totalEntries: purchases.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বাজারের তথ্য লোড করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(['OWNER', 'HOSTEL_MANAGER', 'MEAL_MANAGER']);
    await connectToDatabase();

    const body = await req.json();
    const {
      purchaseDate,
      category,
      items,
      purchasedBy,
      purchasedByResidentId,
      receiptImageUrl,
      receiptPublicId,
      notes,
    } = body;

    if (!purchaseDate || !items || !Array.isArray(items) || items.length === 0 || !purchasedBy) {
      return NextResponse.json(
        { success: false, error: 'তারিখ, বাজারকারী ও কমপক্ষে একটি আইটেম আবশ্যক' },
        { status: 400 }
      );
    }

    // Process and calculate total
    let totalPoisha = 0;
    const formattedItems = items.map((item: any) => {
      const qty = Number(item.quantity) || 1;
      const unitPricePoisha = Math.round((Number(item.unitPriceTaka) || 0) * 100);
      const itemTotalPoisha = Math.round(qty * unitPricePoisha);
      totalPoisha += itemTotalPoisha;

      return {
        itemName: item.itemName?.trim() || 'আইটেম',
        quantity: qty,
        unit: item.unit || 'কেজি',
        unitPricePoisha,
        totalPricePoisha: itemTotalPoisha,
      };
    });

    const count = await BazarPurchase.countDocuments();
    const year = new Date().getFullYear();
    const voucherNumber = `BZR-${year}-${String(count + 1).padStart(5, '0')}`;

    const purchase = await BazarPurchase.create({
      voucherNumber,
      purchaseDate,
      category: category || 'GROCERY',
      items: formattedItems,
      totalAmountPoisha: totalPoisha,
      purchasedBy: purchasedBy.trim(),
      purchasedByResidentId: purchasedByResidentId || null,
      receiptImageUrl: receiptImageUrl || '',
      receiptPublicId: receiptPublicId || '',
      isApproved: true,
      approvedBy: user.id,
      notes: notes || '',
    });

    return NextResponse.json({
      success: true,
      message: `বাজার হিসাব সফলভাবে যোগ হয়েছে (ভাউচার: ${voucherNumber})`,
      data: purchase,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'বাজার এন্ট্রি সম্পন্ন করা যায়নি';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
