import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BUCKET_NAME } from "@/lib/consts";

const s3Client = new S3Client({ region: "eu-west-2" });

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const eventId = params.id;
    const key = `events/${eventId}/qr.png`;

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: 'attachment; filename="event-qr.png"',
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 }); // 1 minute expiry
        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
    }
} 