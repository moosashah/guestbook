import { EventEntity } from '@/lib/models';
import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';
import { generateAndUploadQRCode } from '@/lib/qr-code';
import { VIABLE_PACKAGES } from '@/lib/consts';
import { nanoid } from 'nanoid';
import { multipartUpload } from '@/lib/s3.server';
import { authenticate } from '@/lib/auth.server';

const eventCreateSchema = z
  .object({
    creator_id: z.string(),
    name: z.string().min(1, 'Event name is required'),
    description: z.string().optional().default('my description'),
    banner_image: z.string().optional(),
    welcome_message: z.string().optional(),
    //TODO: add submission start date being in future again
    submission_start_date: z.string().datetime(),
    submission_end_date: z
      .string()
      .datetime()
      .refine(
        date => new Date(date) > new Date(),
        'End date must be in the future'
      ),
    message_count: z.number().default(0),
    package: z.enum(VIABLE_PACKAGES, {
      errorMap: () => ({ message: 'Invalid package type' }),
    }),
    payment_status: z.enum(['pending', 'success']).default('pending'),
  })
  .refine(
    data =>
      new Date(data.submission_end_date) > new Date(data.submission_start_date),
    'End date must be after start date'
  );

export async function POST(req: NextRequest) {
  console.log('[event] Incoming request');

  // Authenticate user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const eventId = nanoid(10);
  console.log('[event] Generated event ID:', eventId);

  try {
    const contentType = req.headers.get('content-type') || '';
    let body: any;
    let bannerImage: File | null = null;
    let welcomeMessageBlob: Blob | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (with potential file upload)
      const formData = await req.formData();
      console.log('[event] Processing FormData');

      // Extract form fields
      body = {
        creator_id: formData.get('creator_id') as string,
        name: formData.get('name') as string,
        description:
          (formData.get('description') as string) || 'my description',
        submission_start_date: formData.get('submission_start_date') as string,
        submission_end_date: formData.get('submission_end_date') as string,
        package: formData.get('package') as string,
        message_count: 0,
        payment_status: 'pending' as const,
      };

      // Extract banner image if present
      const bannerFile = formData.get('banner_image') as File | null;
      if (bannerFile && bannerFile.size > 0) {
        bannerImage = bannerFile;
        console.log(
          '[event] Banner image found:',
          bannerFile.name,
          bannerFile.size,
          'bytes'
        );
      }

      // Extract welcome message blob if present
      const welcomeMessageFile = formData.get('welcome_message') as Blob | null;
      if (welcomeMessageFile && welcomeMessageFile.size > 0) {
        welcomeMessageBlob = welcomeMessageFile;
        console.log(
          '[event] Welcome message found:',
          welcomeMessageFile.size,
          'bytes'
        );
      }
    }

    console.log('[event] Incoming body:', body);

    const validatedData = eventCreateSchema.safeParse(body);

    if (!validatedData.success) {
      console.error('[event] Invalid request data:', validatedData.error);
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error },
        { status: 400 }
      );
    }
    const { data } = validatedData;
    console.log('[event] Data validated successfully');

    // Upload banner image to S3 if provided
    let bannerImageKey: string | undefined;
    if (bannerImage) {
      bannerImageKey = `events/${eventId}/banner.png`;
      console.log('[event] Uploading banner image to S3:', bannerImageKey);

      const arrayBuffer = await bannerImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await multipartUpload(bannerImageKey, buffer, bannerImage.type);
      console.log('[event] Banner image uploaded successfully');
    }

    // Upload welcome message to S3 if provided
    let welcomeMessageKey: string | undefined;
    if (welcomeMessageBlob) {
      welcomeMessageKey = `events/${eventId}/welcome-message.webm`;
      console.log(
        '[event] Uploading welcome message to S3:',
        welcomeMessageKey
      );

      const arrayBuffer = await welcomeMessageBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Welcome messages are typically video/webm from MediaRecorder
      const contentType = 'video/webm';
      await multipartUpload(welcomeMessageKey, buffer, contentType);
      console.log('[event] Welcome message uploaded successfully');
    }

    // Generate QR code and get S3 URL
    console.log('[event] Starting QR code generation process...');
    const qrCodeKey = await generateAndUploadQRCode(eventId);
    console.log(
      '[event] QR code generated and uploaded successfully:',
      qrCodeKey
    );

    console.log('[event] Creating event in DynamoDB...');
    const event = await EventEntity.create({
      ...data,
      id: eventId,
      description: data.description,
      banner_image: bannerImageKey, // Store the S3 key
      welcome_message: welcomeMessageKey, // Store the S3 key
      qr_code_key: qrCodeKey,
    }).go();

    console.log('[event] Event created:', JSON.stringify(event, null, 4));

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('[event] Error in event creation process:', error);
    return NextResponse.json(
      { error: 'Failed to create event', details: error.message },
      { status: 500 }
    );
  }
}
