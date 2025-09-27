import { createEventEntity, createMessageEntity } from '@guestbook/shared';
import DynamoDB from 'aws-sdk/clients/dynamodb';

// Function to ensure database is available
function ensureDbAvailable() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('Database not available - missing AWS credentials');
    }
}

// Create DynamoDB client with lazy initialization
function createDbClient() {
    ensureDbAvailable();
    return new DynamoDB.DocumentClient({
        region: "eu-west-2",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
        }
    });
}

// Create entity instances with lazy initialization
let eventEntity: ReturnType<typeof createEventEntity> | null = null;
let messageEntity: ReturnType<typeof createMessageEntity> | null = null;

export const EventEntity = new Proxy({} as ReturnType<typeof createEventEntity>, {
    get(target, prop) {
        if (!eventEntity) {
            const client = createDbClient();
            eventEntity = createEventEntity(client);
        }
        return (eventEntity as any)[prop];
    }
});

export const MessageEntity = new Proxy({} as ReturnType<typeof createMessageEntity>, {
    get(target, prop) {
        if (!messageEntity) {
            const client = createDbClient();
            messageEntity = createMessageEntity(client);
        }
        return (messageEntity as any)[prop];
    }
});
