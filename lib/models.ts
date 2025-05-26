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
        creator_id: { type: "string", required: true },
        name: { type: "string", required: true },
        description: { type: "string", required: true },
        banner_image: { type: "string" },
        welcome_message: {
            type: "string",
            required: false,
        },
        submission_start_date: { type: "string", required: true },
        submission_end_date: { type: "string", required: true },
        message_count: { type: "number", required: true },
        created_at: { type: "number", required: true, default: () => Date.now(), readOnly: true },
        updated_at: {
            type: "number",
            default: () => Date.now(),
            // watch for changes to any attribute
            watch: "*",
            // set current timestamp when updated
            set: () => Date.now(),
            readOnly: true
        },
        deleted_at: { type: "number", required: true, default: () => 0 },
        qr_code_url: { type: "string", required: true },
        package: { type: ["basic", "deluxe", "premium"] as const, required: true },
        payment_status: { type: ["pending", "success"] as const, required: true }
    },
    indexes: {
        event: {
            pk: { field: "pk", composite: ["id"] },
            sk: { field: "sk", composite: ["id"] }
        },
        byCreator: {
            index: "gsi1pk-gsi1sk-index",
            pk: { field: "gsi1pk", composite: ["creator_id"] },
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
        event_id: { type: "string", required: true },
        guest_name: { type: "string", required: true },
        media_type: { type: ["audio", "video"] as const, required: true },
        media_url: { type: "string", required: true },
        created_at: { type: "number", required: true, default: () => Date.now(), readOnly: true },
        updated_at: {
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
            pk: { field: "pk", composite: ["event_id"] },
            sk: { field: "sk", composite: ["created_at", "id"] }
        }
    }
}, {
    table,
    client
}); 