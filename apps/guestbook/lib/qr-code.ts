import QRCode from 'qrcode';
import { qrCodeUpload } from './s3.server';

export async function generateAndUploadQRCode(
  eventId: string
): Promise<string> {
  console.log('[qr-code] Starting QR code generation for event:', eventId);

  const BASE_URL = process.env.NEXT_PUBLIC_PROD_URL || 'http://localhost:3000';
  const qrCodeUrl = `${BASE_URL}/guest/${eventId}`;
  console.log('[qr-code] Generated URL for QR code:', qrCodeUrl);

  try {
    // Generate QR code as buffer
    console.log('[qr-code] Generating QR code buffer...');
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    console.log(
      '[qr-code] QR code buffer generated successfully, size:',
      qrCodeBuffer.length,
      'bytes'
    );

    // Upload to S3
    const s3Key = `events/${eventId}/qr.png`;
    console.log('[qr-code] Uploading to S3, key:', s3Key);

    await qrCodeUpload(s3Key, qrCodeBuffer);
    console.log('[qr-code] Successfully uploaded to S3');
    return s3Key;
  } catch (error) {
    console.error('[qr-code] Error in QR code generation/upload:', error);
    throw error; // Re-throw to handle in the calling function
  }
}
