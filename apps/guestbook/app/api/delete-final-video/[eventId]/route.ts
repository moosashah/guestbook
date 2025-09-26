import { NextRequest, NextResponse } from 'next/server';
import { EventEntity } from '@/lib/models';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const bucketName = process.env.S3_BUCKET_NAME || "guestbook-assets-2024-dev";

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

        // Delete the video from S3
        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: event.data.final_video_key,
        });

        await s3Client.send(deleteCommand);

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
