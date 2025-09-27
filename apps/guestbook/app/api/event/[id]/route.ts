import { NextRequest, NextResponse } from 'next/server';
import { EventEntity } from '@/lib/models';
import { z } from 'zod';
import { multipartUpload } from '@/lib/s3.server';
import { authenticateAndAuthorizeForEvent } from '@/lib/auth.server';

const eventIdSchema = z.string();

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  // Validate eventId format
  const validationResult = eventIdSchema.safeParse(eventId);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.errors[0].message },
      { status: 400 }
    );
  }

  // Authenticate and authorize user
  const { user, authorized } = await authenticateAndAuthorizeForEvent(
    req,
    eventId
  );
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if event exists
  const existingEvent = await EventEntity.get({ id: eventId }).go();
  if (!existingEvent.data || existingEvent.data.deleted_at !== 0) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  try {
    // Set the deletedAt timestamp in seconds instead of hard deleting
    const deletedAt = Date.now();
    await EventEntity.update({ id: eventId })
      .set({ deleted_at: deletedAt })
      .go();

    return NextResponse.json({
      message: `Event with id ${eventId} marked as deleted.`,
      deleted_at: deletedAt,
    });
  } catch (error: any) {
    console.error('[event] Error marking event as deleted:', error);
    // Avoid exposing internal error details
    return NextResponse.json(
      { error: 'Failed to mark event as deleted' },
      { status: 500 }
    );
  }
}

const editEventSchema = z
  .object({
    name: z.string().min(1, 'Event name is required').optional(),
    description: z.string().optional(),
    submission_start_date: z.string().datetime().optional(),
    submission_end_date: z
      .string()
      .datetime()
      .refine(
        date => new Date(date) > new Date(),
        'End date must be in the future'
      )
      .optional(),
  })
  .refine(data => {
    if (data.submission_start_date && data.submission_end_date) {
      return (
        new Date(data.submission_end_date) >
        new Date(data.submission_start_date)
      );
    }
    return true;
  }, 'End date must be after start date');

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  // Check if event exists
  const existingEvent = await EventEntity.get({ id: eventId }).go();
  if (!existingEvent.data || existingEvent.data.deleted_at !== 0) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Authenticate and authorize user
  const { user, authorized } = await authenticateAndAuthorizeForEvent(
    req,
    eventId
  );
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  // Extract text fields from FormData
  const textFields = {
    name: formData.get('name') as string | null,
    description: formData.get('description') as string | null,
    submission_start_date: formData.get('submission_start_date') as
      | string
      | null,
    submission_end_date: formData.get('submission_end_date') as string | null,
  };

  // Filter out null/empty values and validate
  const filteredFields = Object.fromEntries(
    Object.entries(textFields).filter(
      ([_, value]) => value !== null && value !== ''
    )
  );

  const validatedEditEventBody = editEventSchema.safeParse(filteredFields);
  if (!validatedEditEventBody.success) {
    return NextResponse.json(
      { error: validatedEditEventBody.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    // Prepare update data
    const updateData: any = { ...validatedEditEventBody.data };

    // Handle banner image upload
    const bannerImage = formData.get('banner_image') as File | null;
    if (bannerImage && bannerImage.size > 0) {
      console.log('[PATCH] Uploading banner image:', bannerImage.name);
      const bannerKey = `events/${eventId}/banner.png`;
      const bannerBuffer = Buffer.from(await bannerImage.arrayBuffer());

      await multipartUpload(bannerKey, bannerBuffer, bannerImage.type);
      updateData.banner_image = bannerKey;
    }

    // Handle welcome message upload
    const welcomeMessage = formData.get('welcome_message') as Blob | null;
    if (welcomeMessage && welcomeMessage.size > 0) {
      console.log('[PATCH] Uploading welcome message');
      const welcomeMessageKey = `events/${eventId}/welcome-message.webm`;
      const welcomeMessageBuffer = Buffer.from(
        await welcomeMessage.arrayBuffer()
      );

      await multipartUpload(
        welcomeMessageKey,
        welcomeMessageBuffer,
        'video/webm'
      );
      updateData.welcome_message = welcomeMessageKey;
    }

    // Update the event with only the fields that were provided
    const updatedEvent = await EventEntity.update({ id: eventId })
      .set(updateData)
      .go();
    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('[PATCH] Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}
