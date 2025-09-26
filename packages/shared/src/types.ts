import { EntityItem } from "electrodb";
import { createEventEntity, createMessageEntity } from "./models";
import DynamoDB from "aws-sdk/clients/dynamodb";

// Create dummy client for type inference
const dummyClient = {} as DynamoDB.DocumentClient;

export type Event = EntityItem<ReturnType<typeof createEventEntity>>;
export type Message = EntityItem<ReturnType<typeof createMessageEntity>>;

// Helper to infer entity types
export type EventEntityType = ReturnType<typeof createEventEntity>;
export type MessageEntityType = ReturnType<typeof createMessageEntity>;

