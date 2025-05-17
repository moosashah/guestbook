import type { Event, Message } from "./types"

export const mockEvents: Event[] = [
  {
    id: "1",
    name: "John & Sarah's Wedding",
    description: "Our special day in New York",
    bannerImage: "/wedding-ceremony.png",
    submissionStartDate: "2025-06-01",
    submissionEndDate: "2025-07-01",
    messageCount: 12,
    createdAt: "2025-05-01",
    qrCodeUrl: "/qr-code.png",
    package: "premium",
    paymentStatus: "completed",
  },
  {
    id: "2",
    name: "Anniversary Party",
    description: "10 years of love and happiness",
    bannerImage: "/anniversary-cake-celebration.png",
    submissionStartDate: "2025-08-15",
    submissionEndDate: "2025-09-15",
    messageCount: 5,
    createdAt: "2025-07-20",
    qrCodeUrl: "/qr-code.png",
    package: "basic",
    paymentStatus: "completed",
  },
]

export const mockMessages: Message[] = [
  {
    id: "101",
    eventId: "1",
    guestName: "Mike Johnson",
    mediaType: "video",
    mediaUrl: "/video-message.png",
    createdAt: "2025-06-05",
  },
  {
    id: "102",
    eventId: "1",
    guestName: "Emma Thompson",
    mediaType: "audio",
    mediaUrl: "/placeholder.svg?height=400&width=600&query=audio waveform",
    createdAt: "2025-06-07",
  },
]
