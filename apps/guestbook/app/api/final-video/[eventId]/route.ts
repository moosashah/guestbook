import { NextRequest, NextResponse } from 'next/server';
import { EventEntity } from '@/lib/models';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'eu-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const bucketName = process.env.S3_BUCKET_NAME || "guestbook-assets-2024-dev";

export async function GET(
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
                { error: 'No final video available for this event' },
                { status: 404 }
            );
        }

        // Generate signed URL for download (expires in 1 hour)
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: event.data.final_video_key,
            ResponseContentDisposition: `attachment; filename="compiled-video-${eventId}.mp4"`
        });

        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600, // 1 hour
        });

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
