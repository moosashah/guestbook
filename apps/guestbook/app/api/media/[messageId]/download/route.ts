import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MessageEntity } from '@/lib/models';
import { authenticateAndAuthorizeForEvent } from '@/lib/auth.server';
import { getMediaDownloadUrl } from '@/lib/s3.server';

interface RouteParams {
  params: Promise<{
    messageId: string;
  }>;
}

const querySchema = z.object({
  eventId: z.string(),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { messageId } = await params;
  const url = new URL(req.url);
  const queryParams = Object.fromEntries(url.searchParams.entries());

  // Validate query parameters
  const validationResult = querySchema.safeParse(queryParams);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: validationResult.error.errors,
      },
      { status: 400 }
    );
  }

  const { eventId } = validationResult.data;

  // Authenticate and authorize user for the event
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

  try {
    // Query messages for the specific event and find the one with matching ID
    const { data: messages } = await MessageEntity.query
      .event({ event_id: eventId })
      .go();
    const message = messages.find(m => m.id === messageId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Generate presigned download URL with proper filename
    const fileExtension = message.media_type === 'video' ? 'webm' : 'wav';
    const filename = `${message.guest_name}-${message.media_type}.${fileExtension}`;
    const downloadUrl = await getMediaDownloadUrl(
      message.media_key,
      filename,
      300
    );

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('[MediaDownload] Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}
