import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUploadParams } from '@/lib/cloudinary';
import { requireAuth } from '@/lib/auth/server';

export async function POST(req: NextRequest) {
  try {
    // Ensure caller is an authenticated user
    await requireAuth();

    const body = await req.json().catch(() => ({}));
    const folder = body.folder || 'general';

    const params = generateSignedUploadParams(folder);

    return NextResponse.json({
      success: true,
      data: params,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'স্বাক্ষর তৈরি করা যায়নি';
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }
}
