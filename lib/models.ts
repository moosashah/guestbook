import { Entity } from "electrodb";
import DynamoDB from "aws-sdk/clients/dynamodb";

const client = new DynamoDB.DocumentClient({
    region: "eu-west-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const table = "guestbook-dev"
// Event entity definition
export const EventEntity = new Entity({
    model: {
        entity: "Event",
        version: "1",
        service: "guestbook"
    },
    attributes: {
        id: { type: "string", required: true },
        creatorId: { type: "string", required: true },
        name: { type: "string", required: true },
        description: { type: "string", required: true },
        bannerImage: { type: "string" },
        welcomeMessage: {
            type: "map",
            properties: {
                type: { type: ["audio", "video"] as const },
                url: { type: "string" }
            }
        },
        submissionStartDate: { type: "string", required: true },
        submissionEndDate: { type: "string", required: true },
        messageCount: { type: "number", required: true },
        createdAt: { type: "number", required: true, default: () => Date.now(), readOnly: true },
        updatedAt: {
            type: "number",
            default: () => Date.now(),
            // watch for changes to any attribute
            watch: "*",
            // set current timestamp when updated
            set: () => Date.now(),
            readOnly: true
        },
        qrCodeUrl: { type: "string", required: true },
        package: { type: ["basic", "deluxe", "premium"] as const, required: true },
        paymentStatus: { type: ["pending", "success"] as const, required: true }
    },
    indexes: {
        event: {
            pk: { field: "pk", composite: ["id"] },
            sk: { field: "sk", composite: ["id"] }
        },
        byCreator: {
            index: "gsi1pk-gsi1sk-index",
            pk: { field: "gsi1pk", composite: ["creatorId"] },
            sk: { field: "gsi1sk", composite: ["id"] }
        }
    }
}, {
    table,
    client
});

// Message entity definition
export const MessageEntity = new Entity({
    model: {
        entity: "Message",
        version: "1",
        service: "guestbook"
    },
    attributes: {
        id: { type: "string", required: true },
        eventId: { type: "string", required: true },
        guestName: { type: "string", required: true },
        mediaType: { type: ["audio", "video"] as const, required: true },
        mediaUrl: { type: "string", required: true },
        createdAt: { type: "number", required: true, default: () => Date.now(), readOnly: true },
        updatedAt: {
            type: "number",
            default: () => Date.now(),
            // watch for changes to any attribute
            watch: "*",
            // set current timestamp when updated
            set: () => Date.now(),
            readOnly: true
        },
    },
    indexes: {
        event: {
            pk: { field: "pk", composite: ["eventId"] },
            sk: { field: "sk", composite: ["createdAt", "id"] }
        }
    }
}, {
    table,
    client
}); 