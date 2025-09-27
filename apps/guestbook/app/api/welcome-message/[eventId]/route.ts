import { NextRequest, NextResponse } from "next/server";
import { EventEntity } from "@/lib/models";
import { getWelcomeMessageUrl } from "@/lib/s3.server";

interface RouteParams {
    params: {
        eventId: string;
    };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { eventId } = await params;

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        console.log(`[welcome-message] Getting welcome message URL for event: ${eventId}`);

        // Get the event to retrieve the welcome message key
        const { data: event } = await EventEntity.get({ id: eventId }).go();

        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (!event.welcome_message) {
            return NextResponse.json(
                { error: 'No welcome message found for this event' },
                { status: 404 }
            );
        }

        // Generate signed URL (expires in 1 hour)
        const signedUrl = await getWelcomeMessageUrl(event.welcome_message, 3600);

        console.log(`[welcome-message] Generated signed URL for event ${eventId}`);

        return NextResponse.json({
            url: signedUrl,
            expires_in: 3600,
        });
    } catch (error: any) {
        console.error('[welcome-message] Error generating welcome message URL:', error);
        return NextResponse.json(
            { error: 'Failed to get welcome message URL', details: error.message },
            { status: 500 }
        );
    }
}
