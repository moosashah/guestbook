import { EntityItem } from "electrodb";
import { EventEntity, MessageEntity } from "./models";

export type Event = EntityItem<typeof EventEntity>;

export type Message = EntityItem<typeof MessageEntity>;

export interface UseRecorderProps {
  type: "audio" | "video"
}