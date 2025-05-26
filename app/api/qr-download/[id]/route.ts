import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET_NAME } from "@/lib/consts";
import { z } from "zod";
import { EventEntity } from "@/lib/models";

async function isAuthenticated(req: NextRequest, eventId: string): Promise<boolean> {
    console.log(`Authenticating user for event: ${eventId}`); // Placeholder
    return true; // Assume authenticated for now
}

async function eventExists(eventId: string): Promise<boolean> {
    const e = await EventEntity.get({ id: eventId }).go();
    if (e.data && e.data.deleted_at !== 0) {
        return false
    }
    return true
}

const s3Client = new S3Client({ region: "eu-west-2" });

const eventIdSchema = z.string().uuid({ message: "Invalid event ID format" });

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: eventId } = await params;

    // Validate eventId format using Zod
    const validationResult = eventIdSchema.safeParse(eventId);
    if (!validationResult.success) {
        return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 });
    }

    // Authenticate user
    const authenticated = await isAuthenticated(req, eventId);
    if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if event exists
    const exists = await eventExists(eventId);
    if (!exists) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const key = `events/${eventId}/qr.png`;

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: 'attachment; filename="event-qr.png"',
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // 1 minute expiry
        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    }
} 