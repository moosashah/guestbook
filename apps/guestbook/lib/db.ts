import { createEventEntity, createMessageEntity } from '@guestbook/shared';
import DynamoDB from 'aws-sdk/clients/dynamodb';

// Create DynamoDB client
const client = new DynamoDB.DocumentClient({
    region: "eu-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

// Create entity instances with the client
export const EventEntity = createEventEntity(client);
export const MessageEntity = createMessageEntity(client);
