import { createMessageEntity, createEventEntity } from '../shared/models.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Service } from './s3.js';
import { VideoProcessor } from './video-processor.js';
import { nanoid } from 'nanoid';


export class CompilerService {
    s3Service
    videoProcessor
    compilationStatuses = new Map();
    dynamoClient
    EventEntity
    MessageEntity

    constructor() {
        this.s3Service = new S3Service();
        this.videoProcessor = new VideoProcessor();

        // Validate required environment variables
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.error(JSON.stringify({
                error: 'Missing AWS credentials',
                message: 'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required',
                note: 'Copy env.example to .env and fill in your AWS credentials'
            }, null, 4));
            throw new Error('Missing AWS credentials');
        }

        // Create DynamoDB client
        this.dynamoClient = new DynamoDBClient({
            region: process.env.AWS_REGION || "eu-west-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });

        // Create entity instances with the client
        this.EventEntity = createEventEntity(this.dynamoClient);
        this.MessageEntity = createMessageEntity(this.dynamoClient);

        console.log(JSON.stringify({
            message: 'CompilerService initialized successfully',
            region: process.env.AWS_REGION || "eu-west-2",
            bucket: process.env.S3_BUCKET_NAME || "guestbook-assets-2024-dev"
        }, null, 4));
    }

    async compileEvent(eventId, webhookUrl) {
        try {
            // Set initial status
            this.compilationStatuses.set(eventId, {
                eventId,
                status: 'processing',
                progress: 0
            });

            console.log(JSON.stringify({ message: 'Fetching event and messages', eventId }, null, 4));

            // Fetch event details
            const event = await this.EventEntity.get({ id: eventId }).go();
            if (!event.data) {
                throw new Error(`Event not found: ${eventId}`);
            }

            // Check if final video already exists
            if (event.data.final_video_key) {
                throw new Error(`Final video already exists for event: ${eventId}. Use the existing video or delete it first.`);
            }

            // Fetch all messages for the event
            const messages = await this.MessageEntity.query.event({ event_id: eventId }).go();

            if (!messages.data || messages.data.length === 0) {
                throw new Error(`No messages found for event: ${eventId}`);
            }

            console.log(JSON.stringify({
                message: 'Found messages',
                eventId,
                messageCount: messages.data.length
            }, null, 4));

            // Update progress
            this.updateProgress(eventId, 20);

            // Download media files from S3 and create MediaFile objects
            const mediaFiles = await this.downloadMediaFiles(messages.data);
            this.updateProgress(eventId, 40);

            // Process and stitch videos
            const outputPath = await this.videoProcessor.stitchVideos(
                mediaFiles,
                event.data,
                (progress) => this.updateProgress(eventId, 40 + (progress * 0.4))
            );
            this.updateProgress(eventId, 80);

            // Upload final video to S3
            const { s3Key, s3Url } = await this.s3Service.uploadFinalVideo(outputPath, eventId);
            this.updateProgress(eventId, 90);

            // Update the event with the final video key
            await this.EventEntity.patch({ id: eventId }).set({ final_video_key: s3Key }).go();
            this.updateProgress(eventId, 100);

            // Update status to completed
            this.compilationStatuses.set(eventId, {
                eventId,
                status: 'completed',
                progress: 100,
                outputUrl: s3Url
            });

            console.log(JSON.stringify({
                message: 'Compilation completed',
                eventId,
                finalVideoKey: s3Key,
                outputUrl: s3Url
            }, null, 4));

            // Call webhook if provided
            if (webhookUrl) {
                await this.notifyWebhook(webhookUrl, {
                    eventId,
                    status: 'completed',
                    outputUrl: s3Url
                });
            }

            // Cleanup temporary files
            await this.videoProcessor.cleanup(mediaFiles, outputPath);

        } catch (error) {
            console.error(JSON.stringify({
                error: 'Compilation failed',
                eventId,
                message: error.message
            }, null, 4));

            this.compilationStatuses.set(eventId, {
                eventId,
                status: 'failed',
                error: error.message
            });

            if (webhookUrl) {
                await this.notifyWebhook(webhookUrl, {
                    eventId,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }

    async getCompilationStatus(eventId) {
        return this.compilationStatuses.get(eventId) || {
            eventId,
            status: 'pending'
        };
    }

    updateProgress(eventId, progress) {
        const current = this.compilationStatuses.get(eventId);
        if (current) {
            this.compilationStatuses.set(eventId, {
                ...current,
                progress
            });
        }
    }

    async downloadMediaFiles(messages) {
        const downloadPromises = messages.map(async (message, index) => {
            // Use the correct file extension based on media_type
            const extension = message.media_type === 'video' ? 'webm' : 'wav';
            const localPath = `/tmp/${nanoid()}.${extension}`;
            await this.s3Service.downloadFile(message.media_key, localPath);

            console.log(JSON.stringify({
                message: 'Downloaded media file',
                messageId: message.id,
                mediaType: message.media_type,
                guestName: message.guest_name,
                localPath: localPath
            }, null, 4));

            return {
                path: localPath,
                guestName: message.guest_name,
                mediaType: message.media_type
            }
        });

        return Promise.all(downloadPromises);
    }

    async notifyWebhook(webhookUrl, data) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error(JSON.stringify({
                    error: 'Webhook notification failed',
                    status: response.status
                }, null, 4));
            }
        } catch (error) {
            console.error(JSON.stringify({
                error: 'Failed to call webhook',
                message: error.message
            }, null, 4));
        }
    }
}
