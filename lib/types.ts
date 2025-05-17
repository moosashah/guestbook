export interface Event {
  id: string
  name: string
  description?: string
  bannerImage?: string
  welcomeMessage?: {
    type: "audio" | "video"
    url: string
  }
  submissionStartDate: string
  submissionEndDate: string
  messageCount?: number
  createdAt: string
  qrCodeUrl?: string
  package?: "basic" | "premium" | "deluxe"
  paymentStatus?: "pending" | "completed"
}

export interface Message {
  id: string
  eventId: string
  guestName: string
  mediaType: "audio" | "video"
  mediaUrl: string
  createdAt: string
}
