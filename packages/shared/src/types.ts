import { EntityItem } from "electrodb";
import { createEventEntity, createMessageEntity } from "./models";

export type Event = EntityItem<ReturnType<typeof createEventEntity>>;
export type Message = EntityItem<ReturnType<typeof createMessageEntity>>;

// Helper to infer entity types
export type EventEntityType = ReturnType<typeof createEventEntity>;
export type MessageEntityType = ReturnType<typeof createMessageEntity>;