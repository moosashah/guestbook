import { MessageEntity, EventEntity } from "@/lib/models";
import { s3UploadCommand, multipartUpload, shouldUseMultipartUpload } from "@/lib/s3.server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { PACKAGE_LIMITS } from "@/lib/consts";

const messageCreateSchema = z.object({
    event_id: z.string(),
    guest_name: z.string().min(1, "Guest name is required"),
    media_type: z.enum(["audio", "video"]),
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        console.log("[message] Incoming request with FormData");

        const event_id = formData.get("event_id") as string;
        const guest_name = formData.get("guest_name") as string;
        const media_type = formData.get("media_type") as string;
        const message_blob = formData.get("message_blob") as Blob;

        // Validate request data
        const validatedData = messageCreateSchema.safeParse({
            event_id,
            guest_name,
            media_type,
        });

        if (!validatedData.success) {
            console.error("[message] Invalid request data:", validatedData.error);
            return NextResponse.json(
                { error: "Invalid request data", details: validatedData.error },
                { status: 400 }
            );
        }

        if (!message_blob) {
            return NextResponse.json(
                { error: "Message blob is required" },
                { status: 400 }
            );
        }

        const { event_id: validatedEventId, guest_name: validatedGuestName, media_type: validatedMediaType } = validatedData.data;

        // Get event to check package limits
        const { data: event } = await EventEntity.get({ id: validatedEventId }).go();
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
        if (event.message_count >= PACKAGE_LIMITS[event.package]) {
            return NextResponse.json(
                { error: "Message limit reached for this event" },
                { status: 400 }
            );
        }

        const messageKey = `events/${validatedEventId}/messages/${validatedMediaType}/${nanoid(10)}`;
        const contentType = validatedMediaType === "video" ? "video/webm" : "audio/webm";

        // Convert blob to buffer for upload
        const arrayBuffer = await message_blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[message] Uploading ${validatedMediaType} message, size: ${buffer.length} bytes`);
        console.log(`[message] Will use ${shouldUseMultipartUpload(buffer.length) ? 'multipart' : 'regular'} upload`);

        // Upload message blob to S3 using multipart upload for large files
        await multipartUpload(messageKey, buffer, contentType);

        // Create message
        const message = await MessageEntity.create({
            id: nanoid(10),
            event_id: validatedEventId,
            guest_name: validatedGuestName,
            media_type: validatedMediaType,
            media_key: messageKey,
        }).go();

        // Increment message count
        await EventEntity.patch({ id: validatedEventId }).add({ message_count: 1 }).go();

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