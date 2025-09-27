import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { BUCKET_NAME } from "./consts";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3Client only if credentials are available
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3ClientInstance) {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('S3Client not available - missing AWS credentials');
        }
        s3ClientInstance = new S3Client({
            region: "eu-west-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
    }
    return s3ClientInstance;
}

export const s3Client = getS3Client;

const qrCodeDownloadCommand = (key: string) => new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: 'attachment; filename="event-qr.png"',
});


export const qrCodeDownloadUrl = async (key: string) => {
    const command = qrCodeDownloadCommand(key);
    return getSignedUrl(s3Client(), command, { expiresIn: 60 })
}

const mediaAccessCommand = (key: string) => new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
});

export const getMediaUrl = async (key: string, expiresIn: number = 3600) => {
    const command = mediaAccessCommand(key);
    return getSignedUrl(s3Client(), command, { expiresIn })
}


export const s3UploadCommand = (key: string, body: Buffer, contentType: string, cacheControl?: string) => new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: cacheControl,
});


// Multipart upload configuration
const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB minimum chunk size for S3
const MULTIPART_THRESHOLD = 10 * 1024 * 1024; // 10MB threshold to use multipart

interface MultipartUploadPart {
    ETag: string;
    PartNumber: number;
}

interface MultipartUploadResult {
    Location: string;
    Key: string;
    Bucket: string;
}

export const shouldUseMultipartUpload = (size: number): boolean => {
    return size > MULTIPART_THRESHOLD;
};

export const createMultipartUpload = async (key: string, contentType: string) => {
    const command = new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    const response = await s3Client().send(command);
    return response.UploadId;
};

export const uploadPart = async (
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer
) => {
    const command = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
    });

    const response = await s3Client().send(command);
    return response.ETag;
};

export const completeMultipartUpload = async (
    key: string,
    uploadId: string,
    parts: MultipartUploadPart[]
): Promise<MultipartUploadResult> => {
    const command = new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts,
        },
    });

    const response = await s3Client().send(command);
    return {
        Location: response.Location || `https://${BUCKET_NAME}.s3.eu-west-2.amazonaws.com/${key}`,
        Key: response.Key || key,
        Bucket: response.Bucket || BUCKET_NAME,
    };
};

export const abortMultipartUpload = async (key: string, uploadId: string) => {
    const command = new AbortMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
    });

    await s3Client().send(command);
};

export const multipartUpload = async (
    key: string,
    buffer: Buffer,
    contentType: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
): Promise<void> => {
    const fileSize = buffer.length;

    if (!shouldUseMultipartUpload(fileSize)) {
        // Use regular upload for smaller files
        const command = s3UploadCommand(key, buffer, contentType);
        await s3Client().send(command);
    }

    console.log(`[multipart-upload] Starting multipart upload for ${key}, size: ${fileSize} bytes`);

    const uploadId = await createMultipartUpload(key, contentType);
    if (!uploadId) {
        throw new Error('Failed to create multipart upload');
    }

    const parts: MultipartUploadPart[] = [];
    const totalParts = Math.ceil(fileSize / MULTIPART_CHUNK_SIZE);
    let uploadedBytes = 0;

    try {
        for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
            const start = (partNumber - 1) * MULTIPART_CHUNK_SIZE;
            const end = Math.min(start + MULTIPART_CHUNK_SIZE, fileSize);
            const partBuffer = buffer.subarray(start, end);

            console.log(`[multipart-upload] Uploading part ${partNumber}/${totalParts}, size: ${partBuffer.length} bytes`);

            const etag = await uploadPart(key, uploadId, partNumber, partBuffer);
            if (!etag) {
                throw new Error(`Failed to upload part ${partNumber}`);
            }

            parts.push({
                ETag: etag,
                PartNumber: partNumber,
            });

            uploadedBytes += partBuffer.length;

            if (onProgress) {
                onProgress({
                    loaded: uploadedBytes,
                    total: fileSize,
                    percentage: Math.round((uploadedBytes / fileSize) * 100),
                });
            }
        }

        const result = await completeMultipartUpload(key, uploadId, parts);
        console.log(`[multipart-upload] Successfully completed multipart upload for ${key}`);
    } catch (error) {
        console.error(`[multipart-upload] Error during multipart upload for ${key}:`, error);
        await abortMultipartUpload(key, uploadId);
        throw error;
    }
};


export const qrCodeUpload = async (key: string, qrCodeBuffer: Buffer) =>
    await s3Client().send(s3UploadCommand(key, qrCodeBuffer, 'image/png', 'public, max-age=31536000'))

// Final video operations
export const getFinalVideoDownloadUrl = async (key: string, eventId: string) => {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="compiled-video-${eventId}.mp4"`
    });
    return getSignedUrl(s3Client(), command, { expiresIn: 3600 }); // 1 hour
};

export const deleteFinalVideo = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });
    await s3Client().send(command);
};