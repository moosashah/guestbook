import { NextRequest, NextResponse } from "next/server";


const viablePackages = ["basic", "premium", "deluxe"];

export async function POST(req: NextRequest) {
    console.log("[event] Incoming request");
    try {
        const data = await req.json();
        console.log("[event] Incoming body:", data);

        // TODO: Validate the request data
        if (!data.name) {
            return NextResponse.json(
                { error: "Event name is required" },
                { status: 400 }
            );
        }
        if (!data.package) {
            return NextResponse.json(
                { error: "Package is required" },
                { status: 400 }
            );
        }
        if (!viablePackages.includes(data.package)) {
            return NextResponse.json(
                { error: "Invalid package" },
                { status: 400 }
            );
        }

        // TODO: Create the event in the database
        const event = {
            id: "mock-id", // This would come from the database
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            mediaType: data.mediaType,
            package: data.package,
            // Add other fields as needed
        };

        return NextResponse.json(event);
    } catch (error: any) {
        console.error("Error creating event:", error);
        return NextResponse.json(
            { error: "Failed to create event" },
            { status: 500 }
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
            { status: 500 }
        );
    }
}
