import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { EventEntity } from '@/lib/models';
import { PACKAGE_LIMITS } from '@/lib/consts';
import { createMultipartUpload } from '@/lib/s3.server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadPartCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3.server';
import { BUCKET_NAME } from '@/lib/consts';

const initiateUploadSchema = z.object({
  event_id: z.string(),
  guest_name: z.string().min(1, 'Guest name is required'),
  media_type: z.enum(['audio', 'video']),
  file_size: z.number().positive(),
  parts_count: z.number().int().positive(),
});

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[initiate-upload] Incoming request:', body);

    // Validate request data
    const validatedData = initiateUploadSchema.safeParse(body);

    if (!validatedData.success) {
      console.error(
        '[initiate-upload] Invalid request data:',
        validatedData.error
      );
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error },
        { status: 400 }
      );
    }

    const { event_id, guest_name, media_type, file_size, parts_count } =
      validatedData.data;

    // Get event to check package limits
    const { data: event } = await EventEntity.get({
      id: event_id,
    }).go();

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is within submission period
    const now = new Date();
    if (
      now < new Date(event.submission_start_date) ||
      now > new Date(event.submission_end_date)
    ) {
      return NextResponse.json(
        { error: 'Event is not accepting messages at this time' },
        { status: 400 }
      );
    }

    // Check if message limit is reached
    if (event.message_count >= PACKAGE_LIMITS[event.package]) {
      return NextResponse.json(
        { error: 'Message limit reached for this event' },
        { status: 400 }
      );
    }

    // Generate message ID and S3 key
    const messageId = nanoid(10);
    const messageKey = `events/${event_id}/messages/${media_type}/${messageId}`;
    const contentType = media_type === 'video' ? 'video/webm' : 'audio/webm';

    console.log(
      `[initiate-upload] Creating multipart upload for ${messageKey}, size: ${file_size} bytes, parts: ${parts_count}`
    );

    // Initiate multipart upload in S3
    const uploadId = await createMultipartUpload(messageKey, contentType);

    if (!uploadId) {
      throw new Error('Failed to create multipart upload');
    }

    // Generate presigned URLs for each part
    const presignedUrls: string[] = [];
    for (let partNumber = 1; partNumber <= parts_count; partNumber++) {
      const command = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: messageKey,
        UploadId: uploadId,
        PartNumber: partNumber,
      });

      const presignedUrl = await getSignedUrl(s3Client(), command, {
        expiresIn: 3600, // 1 hour
      });
      presignedUrls.push(presignedUrl);
    }

    console.log(
      `[initiate-upload] Generated ${presignedUrls.length} presigned URLs for upload`
    );

    return NextResponse.json({
      message_id: messageId,
      upload_id: uploadId,
      message_key: messageKey,
      presigned_urls: presignedUrls,
      expires_in: 3600,
    });
  } catch (error: any) {
    console.error('[initiate-upload] Error initiating upload:', error);
    return NextResponse.json(
      { error: 'Failed to initiate upload', details: error.message },
      { status: 500 }
    );
  }
}
