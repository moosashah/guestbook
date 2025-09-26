import { MessageEntity } from '@/lib/models';
import { getMediaUrl } from '@/lib/s3.server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    messageId: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { messageId } = params;
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    console.log(
      `[media] Getting media URL for message: ${messageId}${eventId ? ` in event: ${eventId}` : ''}`
    );

    let message = null;

    try {
      if (eventId) {
        // More efficient: Query messages for the specific event first
        console.log(
          `[media] Using efficient event-based query for event: ${eventId}`
        );
        const { data: messages } = await MessageEntity.query
          .event({ event_id: eventId })
          .go();
        message = messages.find(m => m.id === messageId);
      } else {
        // Fallback: Scan all messages to find the one with matching ID
        // This is not ideal for production, but works for getting the message by ID
        console.log(`[media] Using scan fallback (less efficient)`);
        //TODO: Add a GSI for message ID lookups
        const { data: allMessages } = await MessageEntity.scan.go();
        message = allMessages.find(m => m.id === messageId);
      }

      if (!message) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error(`[media] Error fetching message:`, error);
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getMediaUrl(message.media_key, 3600);

    console.log(`[media] Generated signed URL for message ${messageId}`);

    return NextResponse.json({
      url: signedUrl,
      media_type: message.media_type,
      expires_in: 3600,
    });
  } catch (error: any) {
    console.error('[media] Error generating media URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate media URL' },
      { status: 500 }
    );
  }
}
