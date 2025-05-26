import { MessageEntity, EventEntity } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";


//TODO: Move to a config file
const packageLimits = {
    basic: 50,
    premium: 100,
    deluxe: 200,
} as const;

const messageCreateSchema = z.object({
    eventId: z.string().uuid(),
    guestName: z.string().min(1, "Guest name is required"),
    mediaType: z.enum(["audio", "video"]),
    mediaUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log("[message] Incoming request body:", body);

        // Validate request body
        const validatedData = messageCreateSchema.safeParse(body);
        if (!validatedData.success) {
            console.error("[message] Invalid request data:", validatedData.error);
            return NextResponse.json(
                { error: "Invalid request data", details: validatedData.error },
                { status: 400 }
            );
        }

        const { eventId, guestName, mediaType, mediaUrl } = validatedData.data;

        // Get event to check package limits
        const { data: event } = await EventEntity.get({ id: eventId }).go();
        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Check if event is within submission period
        const now = new Date();
        if (now < new Date(event.submissionStartDate) || now > new Date(event.submissionEndDate)) {
            return NextResponse.json(
                { error: "Event is not accepting messages at this time" },
                { status: 400 }
            );
        }

        // Check if message limit is reached
        if (event.messageCount >= packageLimits[event.package]) {
            return NextResponse.json(
                { error: "Message limit reached for this event" },
                { status: 400 }
            );
        }

        // Create message
        const message = await MessageEntity.create({
            id: crypto.randomUUID(),
            eventId,
            guestName,
            mediaType,
            mediaUrl,
        }).go();

        await EventEntity.patch({ id: eventId }).add({ messageCount: 1 }).go();

        console.log("[message] Message created:", message);
        return NextResponse.json(message);
    } catch (error: any) {
        console.error("[message] Error creating message:", error);
        return NextResponse.json(
            { error: "Failed to create message" },
            { status: 500 }
        );
    }
} 