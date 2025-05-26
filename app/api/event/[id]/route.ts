import { NextRequest, NextResponse } from "next/server";
import { EventEntity } from "@/lib/models";

export async function DELETE(
    _: NextRequest,
    { params }: { params: { id: string } }
) {
    const eventId = params.id;

    if (!eventId) {
        return NextResponse.json(
            { error: "Missing event id" },
            { status: 400 }
        );
    }

    try {
        // Set the deletedAt timestamp instead of hard deleting
        const deletedAt = Date.now();
        const result = await EventEntity.update({ id: eventId })
            .set({ deleted_at: deletedAt })
            .go();

        return NextResponse.json(
            { message: `Event with id ${eventId} marked as deleted.`, deleted_at: deletedAt }
        );
    } catch (error: any) {
        console.error("[event] Error marking event as deleted:", error);
        return NextResponse.json(
            { error: "Failed to mark event as deleted", details: error.message },
            { status: 500 }
        );
    }
}

