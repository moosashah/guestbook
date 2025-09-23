import QRCode from 'qrcode';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BUCKET_NAME } from './consts';

const s3Client = new S3Client({
    region: 'eu-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

export async function generateAndUploadQRCode(eventId: string): Promise<string> {
    console.log("[qr-code] Starting QR code generation for event:", eventId);

    const BASE_URL = process.env.NEXT_PUBLIC_PROD_URL || 'http://localhost:3000';
    const qrCodeUrl = `${BASE_URL}/guest/${eventId}`;
    console.log("[qr-code] Generated URL for QR code:", qrCodeUrl);

    try {
        // Generate QR code as buffer
        console.log("[qr-code] Generating QR code buffer...");
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 400,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        console.log("[qr-code] QR code buffer generated successfully, size:", qrCodeBuffer.length, "bytes");

        // Upload to S3
        const s3Key = `events/${eventId}/qr.png`;
        console.log("[qr-code] Uploading to S3, key:", s3Key);

        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: qrCodeBuffer,
            ContentType: 'image/png',
            CacheControl: 'public, max-age=31536000' // Cache for 1 year
        }));
        console.log("[qr-code] Successfully uploaded to S3");

        // Return the S3 URL
        const s3Url = `https://${BUCKET_NAME}.s3.eu-west-2.amazonaws.com/${s3Key}`;
        console.log("[qr-code] Generated S3 URL:", s3Url);
        return s3Url;
    } catch (error) {
        console.error("[qr-code] Error in QR code generation/upload:", error);
        throw error; // Re-throw to handle in the calling function
    }
} 