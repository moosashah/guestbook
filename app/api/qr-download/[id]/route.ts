import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { EventEntity } from "@/lib/models";
import { qrCodeDownloadUrl } from "@/lib/s3.server";

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



const eventIdSchema = z.string()

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



    try {
        const url = await qrCodeDownloadUrl(key);
        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    }
} 