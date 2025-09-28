import { MessageEntity } from '@/lib/models';
import { getObjectByRange, headObject } from '@/lib/s3.server';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    messageId: string;
  };
}

export async function GET(req: NextRequest, ctx: any) {
  try {
    const { messageId } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    console.log(
      `[media-stream] Streaming media for message: ${messageId}${eventId ? ` in event: ${eventId}` : ''}`
    );

    // Find the message
    let message = null;
    try {
      if (eventId) {
        const { data: messages } = await MessageEntity.query
          .event({ event_id: eventId })
          .go();
        message = messages.find(m => m.id === messageId);
      } else {
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
      console.error(`[media-stream] Error fetching message:`, error);
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Get range header for streaming support
    const range = req.headers.get('range');

    // First, get object metadata to know the total size
    let objectSize: number;
    let contentType: string;

    try {
      const headResult = await headObject(message.media_key);
      objectSize = headResult.ContentLength || 0;
      contentType =
        headResult.ContentType ||
        (message.media_type === 'video' ? 'video/webm' : 'audio/wav');
    } catch (error) {
      console.error(`[media-stream] Error getting object metadata:`, error);
      return NextResponse.json(
        { error: 'Media file not found' },
        { status: 404 }
      );
    }

    // Parse range header
    let start = 0;
    let end = objectSize - 1;

    if (range) {
      const matches = range.match(/bytes=(\d+)-(\d*)/);
      if (matches) {
        start = parseInt(matches[1], 10);
        if (matches[2]) {
          end = parseInt(matches[2], 10);
        }
      }
    }

    // Ensure end doesn't exceed file size
    end = Math.min(end, objectSize - 1);
    const contentLength = end - start + 1;

    console.log(
      `[media-stream] Streaming bytes ${start}-${end}/${objectSize} for message ${messageId}`
    );

    // Get the object from S3 with range
    try {
      const s3Object = await getObjectByRange(
        message.media_key,
        `bytes=${start}-${end}`
      );

      const headers = new Headers();
      headers.set('Content-Type', contentType);
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Content-Length', contentLength.toString());

      if (range) {
        headers.set('Content-Range', `bytes ${start}-${end}/${objectSize}`);
        headers.set('Cache-Control', 'no-cache');

        return new Response(s3Object.Body as BodyInit, {
          status: 206, // Partial Content
          headers,
        });
      } else {
        headers.set('Cache-Control', 'public, max-age=3600');

        return new Response(s3Object.Body as BodyInit, {
          status: 200,
          headers,
        });
      }
    } catch (error) {
      console.error(`[media-stream] Error streaming from S3:`, error);
      return NextResponse.json(
        { error: 'Failed to stream media' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[media-stream] Error in streaming endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to stream media' },
      { status: 500 }
    );
  }
}
