import { NextRequest, NextResponse } from 'next/server';
import { EventEntity } from '@/lib/models';
import { deleteFinalVideo } from '@/lib/s3.server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ eventId: string }> }
) {
    try {
        const { eventId } = await params;

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
                { error: 'No final video to delete' },
                { status: 404 }
            );
        }

        // Delete the video from S3 using centralized S3 service
        await deleteFinalVideo(event.data.final_video_key);

        // Remove the final video key from the database
        await EventEntity.patch({ id: eventId }).remove(['final_video_key']).go();

        console.log(JSON.stringify({
            message: 'Final video deleted successfully',
            eventId,
            deletedKey: event.data.final_video_key
        }, null, 4));

        return NextResponse.json({
            message: 'Final video deleted successfully',
            eventId
        });

    } catch (error) {
        console.error(JSON.stringify({
            error: 'Failed to delete final video',
            eventId: (await params).eventId,
            message: (error as Error).message
        }, null, 4));

        return NextResponse.json(
            { error: 'Failed to delete final video' },
            { status: 500 }
        );
    }
}
