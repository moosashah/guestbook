import { NextRequest, NextResponse } from "next/server";
import { EventEntity } from "@/lib/models";
import { z } from "zod";

async function isAuthenticated(req: NextRequest, eventId: string): Promise<boolean> {
    console.log("Authenticating user for event: " + eventId); // Placeholder
    return true; // Assume authenticated for now
}


async function isAuthorized(req: NextRequest, eventId: string): Promise<boolean> {
    console.log("Authorizing user for event: " + eventId); // Placeholder
    return true; // Assume authorized for now
}

const eventIdSchema = z.string().uuid({ message: "Invalid event ID format" });

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const eventId = params.id;

    // Validate eventId format
    const validationResult = eventIdSchema.safeParse(eventId);
    if (!validationResult.success) {
        return NextResponse.json({ error: validationResult.error.errors[0].message }, { status: 400 });
    }

    // Authenticate user
    const authenticated = await isAuthenticated(req, eventId);
    if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorize user
    const authorized = await isAuthorized(req, eventId);
    if (!authorized) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if event exists
    const existingEvent = await EventEntity.get({ id: eventId }).go();
    if (!existingEvent.data || existingEvent.data.deleted_at !== 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    try {
        // Set the deletedAt timestamp in seconds instead of hard deleting
        const deletedAt = Date.now()
        await EventEntity.update({ id: eventId })
            .set({ deleted_at: deletedAt })
            .go();

        return NextResponse.json(
            { message: `Event with id ${eventId} marked as deleted.`, deleted_at: deletedAt }
        );
    } catch (error: any) {
        console.error("[event] Error marking event as deleted:", error);
        // Avoid exposing internal error details
        return NextResponse.json(
            { error: "Failed to mark event as deleted" },
            { status: 500 }
        );
    }
}

