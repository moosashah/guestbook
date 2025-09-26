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

const eventIdSchema = z.string();

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: eventId } = await params

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

const editEventSchema = z.object({
    submission_start_date: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "Start date must be in the future"
    ),
    submission_end_date: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "End date must be in the future"
    ),
}).refine(
    (data) => new Date(data.submission_end_date) > new Date(data.submission_start_date),
    "End date must be after start date"
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params

    // Check if event exists
    const existingEvent = await EventEntity.get({ id: eventId }).go();
    if (!existingEvent.data || existingEvent.data.deleted_at !== 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
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

    // Validate payload with zod
    let body;
    try {
        body = await req.json();
    } catch (err) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedEditEventBody = editEventSchema.safeParse(body);
    if (!validatedEditEventBody.success) {
        return NextResponse.json(
            { error: validatedEditEventBody.error.errors[0].message },
            { status: 400 }
        );
    }

    try {
        const updatedEvent = await EventEntity.update({ id: eventId }).set({
            submission_start_date: validatedEditEventBody.data.submission_start_date,
            submission_end_date: validatedEditEventBody.data.submission_end_date
        }).go();
        return NextResponse.json(updatedEvent);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
    }
}