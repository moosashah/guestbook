import { NextRequest, NextResponse } from 'next/server';

const COMPILER_SERVICE_URL = process.env.COMPILER_SERVICE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { eventId, webhookUrl } = body;

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        console.log(JSON.stringify({
            message: 'Triggering compilation',
            eventId,
            webhookUrl
        }, null, 4));

        // Call the compiler service
        const response = await fetch(`${COMPILER_SERVICE_URL}/compile/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ webhookUrl }),
        });

        if (!response.ok) {
            throw new Error(`Compiler service responded with status: ${response.status}`);
        }

        const result = await response.json();

        return NextResponse.json({
            message: 'Compilation started successfully',
            eventId,
            status: result.status
        });

    } catch (error) {
        console.error(JSON.stringify({
            error: 'Failed to trigger compilation',
            message: (error as Error).message
        }, null, 4));

        return NextResponse.json(
            { error: 'Failed to trigger compilation' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');

        if (!eventId) {
            return NextResponse.json(
                { error: 'Event ID is required' },
                { status: 400 }
            );
        }

        // Get compilation status from compiler service
        const response = await fetch(`${COMPILER_SERVICE_URL}/status/${eventId}`);

        if (!response.ok) {
            throw new Error(`Compiler service responded with status: ${response.status}`);
        }

        const status = await response.json();

        return NextResponse.json(status);

    } catch (error) {
        console.error(JSON.stringify({
            error: 'Failed to get compilation status',
            message: (error as Error).message
        }, null, 4));

        return NextResponse.json(
            { error: 'Failed to get compilation status' },
            { status: 500 }
        );
    }
}
