import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { abortMultipartUpload } from '@/lib/s3.server';

const abortUploadSchema = z.object({
  message_key: z.string(),
  upload_id: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[abort-upload] Incoming request');

    // Validate request data
    const validatedData = abortUploadSchema.safeParse(body);

    if (!validatedData.success) {
      console.error(
        '[abort-upload] Invalid request data:',
        validatedData.error
      );
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error },
        { status: 400 }
      );
    }

    const { message_key, upload_id } = validatedData.data;

    console.log(
      `[abort-upload] Aborting multipart upload for ${message_key}, upload_id: ${upload_id}`
    );

    // Abort the multipart upload in S3
    await abortMultipartUpload(message_key, upload_id);

    console.log('[abort-upload] Multipart upload aborted successfully');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[abort-upload] Error aborting upload:', error);
    return NextResponse.json(
      { error: 'Failed to abort upload', details: error.message },
      { status: 500 }
    );
  }
}
