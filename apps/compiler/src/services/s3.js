import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';

export class S3Service {
    s3Client
    bucketName

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'eu-west-2',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });

        this.bucketName = process.env.S3_BUCKET_NAME || "guestbook-assets-2024-dev";
    }

    async downloadFile(s3Key, localPath) {
        try {
            console.log(JSON.stringify({
                message: 'Downloading file from S3',
                s3Key,
                localPath
            }, null, 4));

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                throw new Error(`No body in S3 response for key: ${s3Key}`);
            }

            // Create write stream and pipe the S3 object body to it
            const writeStream = createWriteStream(localPath);

            return new Promise((resolve, reject) => {
                if (response.Body instanceof ReadableStream) {
                    // Handle ReadableStream (browser environment)
                    const reader = response.Body.getReader();
                    const pump = async () => {
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                writeStream.write(Buffer.from(value));
                            }
                            writeStream.end();
                            resolve();
                        } catch (error) {
                            writeStream.destroy();
                            reject(error);
                        }
                    };
                    pump();
                } else {
                    // Handle Node.js readable stream - check if it has pipe method
                    const body = response.Body;
                    if (body && typeof body.pipe === 'function') {
                        body.pipe(writeStream)
                            .on('finish', resolve)
                            .on('error', reject);
                    } else {
                        reject(new Error('Unsupported body type'));
                    }
                }
            });
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Failed to download file from S3',
                s3Key,
                message: error.message
            }, null, 4));
            throw error;
        }
    }

    async uploadFinalVideo(localPath, eventId) {
        try {
            const fileName = `events/${eventId}/compiled-${nanoid()}.mp4`;

            console.log(JSON.stringify({
                message: 'Uploading final video to S3',
                localPath,
                s3Key: fileName
            }, null, 4));

            // Read the file
            const fileContent = await fs.readFile(localPath);

            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: fileContent,
                ContentType: 'video/mp4',
                Metadata: {
                    'event-id': eventId,
                    'type': 'compiled-video'
                }
            });

            await this.s3Client.send(command);

            // Return both the S3 key and URL
            const s3Url = `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'eu-west-2'}.amazonaws.com/${fileName}`;

            console.log(JSON.stringify({
                message: 'Successfully uploaded final video',
                s3Key: fileName,
                s3Url
            }, null, 4));

            return { s3Key: fileName, s3Url };
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Failed to upload final video to S3',
                localPath,
                message: error.message
            }, null, 4));
            throw error;
        }
    }

    async getSignedUrl(s3Key, expiresIn = 3600) {
        try {
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: s3Key,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn,
            });

            return signedUrl;
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Failed to generate signed URL',
                s3Key,
                message: error.message
            }, null, 4));
            throw error;
        }
    }
}
