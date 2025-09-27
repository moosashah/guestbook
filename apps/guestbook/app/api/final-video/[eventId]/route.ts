import { NextRequest, NextResponse } from 'next/server';
import { EventEntity } from '@/lib/models';
import { getFinalVideoDownloadUrl } from '@/lib/s3.server';
import { authenticateAndAuthorizeForEvent } from '@/lib/auth.server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

        // Authenticate and authorize user
        const { user, authorized } = await authenticateAndAuthorizeForEvent(request, eventId);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!authorized) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch event to check if final video exists
        const event = await EventEntity.get({ id: eventId }).go();
        if (!event.data) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (!event.data.final_video_key) {
            return NextResponse.json(
                { error: 'No final video available for this event' },
                { status: 404 }
            );
        }

        // Generate signed URL for download using centralized S3 service
        const signedUrl = await getFinalVideoDownloadUrl(event.data.final_video_key, eventId);

        return NextResponse.json({
            downloadUrl: signedUrl,
            filename: `compiled-video-${eventId}.mp4`
        });

    } catch (error) {
        console.error(JSON.stringify({
            error: 'Failed to generate download URL',
            eventId: (await params).eventId,
            message: (error as Error).message
        }, null, 4));

        return NextResponse.json(
            { error: 'Failed to generate download URL' },
            { status: 500 }
        );
    }
}
