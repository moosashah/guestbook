import { EventEntity } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";
import { generateAndUploadQRCode } from "@/lib/qr-code";
import { VIABLE_PACKAGES } from "@/lib/consts";



export const eventCreateSchema = z.object({
    creator_id: z.string(),
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    banner_image: z.string().optional(),
    welcome_message: z.string().optional(),
    submission_start_date: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "Start date must be in the future"
    ),
    submission_end_date: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "End date must be in the future"
    ),
    message_count: z.number().default(0),
    qr_code_url: z.string().optional(), // this neeeds to be generated and stored to the database
    package: z.enum(VIABLE_PACKAGES, {
        errorMap: () => ({ message: "Invalid package type" }),
    }),
    payment_status: z.enum(["pending", "success"]).default("pending"),
}).refine(
    (data) => new Date(data.submission_end_date) > new Date(data.submission_start_date),
    "End date must be after start date"
);

export async function POST(req: NextRequest) {
    console.log("[event] Incoming request");
    //TODO: This will need to be a form submission since we're also sending the voice message blob
    //TODO: We need to store the voice message blob to S3 and store the uri to dynamodb


    const eventId = crypto.randomUUID();
    console.log("[event] Generated event ID:", eventId);

    try {
        const body = await req.json();
        console.log("[event] Incoming body:", body);

        const validatedData = eventCreateSchema.safeParse(body);

        if (!validatedData.success) {
            console.error("[event] Invalid request data:", validatedData.error);
            return NextResponse.json(
                { error: "Invalid request data", details: validatedData.error },
                { status: 400 },
            );
        }
        const { data } = validatedData;
        console.log("[event] Data validated successfully");

        // Generate QR code and get S3 URL
        console.log("[event] Starting QR code generation process...");
        const qrCodeUrl = await generateAndUploadQRCode(eventId);
        console.log("[event] QR code generated and uploaded successfully:", qrCodeUrl);

        console.log("[event] Creating event in DynamoDB...");
        const event = await EventEntity.create({
            ...data,
            id: eventId,
            description: data.description || "my description",
            qr_code_url: qrCodeUrl,
        }).go();

        console.log("[event] Event created:", JSON.stringify(event, null, 4));

        return NextResponse.json(event);
    } catch (error: any) {
        console.error("[event] Error in event creation process:", error);
        return NextResponse.json(
            { error: "Failed to create event", details: error.message },
            { status: 500 },
        );
    }
}



