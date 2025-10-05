import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MessageEntity, EventEntity } from '@/lib/models';
import { completeMultipartUpload } from '@/lib/s3.server';

const completeUploadSchema = z.object({
  message_id: z.string(),
  event_id: z.string(),
  guest_name: z.string().min(1, 'Guest name is required'),
  media_type: z.enum(['audio', 'video']),
  message_key: z.string(),
  upload_id: z.string(),
  parts: z.array(
    z.object({
      ETag: z.string(),
      PartNumber: z.number().int().positive(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[complete-upload] Incoming request');

    // Validate request data
    const validatedData = completeUploadSchema.safeParse(body);

    if (!validatedData.success) {
      console.error(
        '[complete-upload] Invalid request data:',
        validatedData.error
      );
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error },
        { status: 400 }
      );
    }

    const {
      message_id,
      event_id,
      guest_name,
      media_type,
      message_key,
      upload_id,
      parts,
    } = validatedData.data;

    console.log(
      `[complete-upload] Completing multipart upload for ${message_key} with ${parts.length} parts`
    );

    // Complete the multipart upload in S3
    await completeMultipartUpload(message_key, upload_id, parts);

    console.log('[complete-upload] Multipart upload completed successfully');

    // Create message in database
    const message = await MessageEntity.create({
      id: message_id,
      event_id,
      guest_name,
      media_type,
      media_key: message_key,
    }).go();

    // Increment message count
    await EventEntity.patch({ id: event_id }).add({ message_count: 1 }).go();

    console.log('[complete-upload] Message created:', message);
    return NextResponse.json(message);
  } catch (error: any) {
    console.error('[complete-upload] Error completing upload:', error);
    return NextResponse.json(
      { error: 'Failed to complete upload', details: error.message },
      { status: 500 }
    );
  }
}
