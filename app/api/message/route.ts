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
    event_id: z.string().uuid(),
    guest_name: z.string().min(1, "Guest name is required"),
    media_type: z.enum(["audio", "video"]),
    media_url: z.string().url(),
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

        const { event_id, guest_name, media_type, media_url } = validatedData.data;

        // Get event to check package limits
        const { data: event } = await EventEntity.get({ id: event_id }).go();
        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        // Check if event is within submission period
        const now = new Date();
        if (now < new Date(event.submission_start_date) || now > new Date(event.submission_end_date)) {
            return NextResponse.json(
                { error: "Event is not accepting messages at this time" },
                { status: 400 }
            );
        }

        // Check if message limit is reached
        if (event.message_count >= packageLimits[event.package]) {
            return NextResponse.json(
                { error: "Message limit reached for this event" },
                { status: 400 }
            );
        }

        // Create message
        const message = await MessageEntity.create({
            id: crypto.randomUUID(),
            event_id,
            guest_name,
            media_type,
            media_url,
        }).go();

        // Increment message count
        await EventEntity.patch({ id: event_id }).add({ message_count: 1 }).go();

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