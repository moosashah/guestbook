import { EventEntity } from "@/lib/models";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const viablePackages = ["basic", "premium", "deluxe"] as const;

export const eventCreateSchema = z.object({
    creatorId: z.string(),
    name: z.string().min(1, "Event name is required"),
    description: z.string().optional(),
    bannerImage: z.string().optional(),
    welcomeMessage: z
        .object({
            type: z.enum(["audio", "video"]),
            url: z.string(),
        })
        .optional(),
    submissionStartDate: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "Start date must be in the future"
    ),
    submissionEndDate: z.string().datetime().refine(
        (date) => new Date(date) > new Date(),
        "End date must be in the future"
    ),
    messageCount: z.number().default(0),
    qrCodeUrl: z.string().optional(), // this neeeds to be generated and stored to the database
    package: z.enum(viablePackages, {
        errorMap: () => ({ message: "Invalid package type" }),
    }),
    paymentStatus: z.enum(["pending", "success"]).default("pending"),
}).refine(
    (data) => new Date(data.submissionEndDate) > new Date(data.submissionStartDate),
    "End date must be after start date"
);

export async function POST(req: NextRequest) {
    console.log("[event] Incoming request");
    //TODO: This will need to be a form submission since we're also sending the voice message blob
    //TODO: We need to store the voice message blob to S3 and store the uri to dynamodb
    //TODO: We need to generate a qr code for the event and store the uri to dynamodb
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

        const event = await EventEntity.create({
            ...data,
            id: crypto.randomUUID(),
            description: data.description || "my description",
            qrCodeUrl: data.qrCodeUrl || "url.com",
        }).go();

        console.log("[event] Event created:", JSON.stringify(event, null, 4));


        return NextResponse.json(event);
    } catch (error: any) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 },
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        // TODO: Implement event fetching logic
        return NextResponse.json({ message: "Event fetch not implemented" });
    } catch (error: any) {
        console.error("Error fetching events:", error);
        return NextResponse.json(
            { error: "Failed to fetch events" },
            { status: 500 },
        );
    }
}
