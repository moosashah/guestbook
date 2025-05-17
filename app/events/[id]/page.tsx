"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, Download, Share2, Edit, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"
import { mockEvents, mockMessages } from "@/lib/mock-data"
import MessageCard from "@/components/message-card"
import { useToast } from "@/hooks/use-toast"
import { getEvents, getMessagesForEvent, isOffline, saveMessages } from "@/lib/offline-storage"
import type { Event, Message } from "@/lib/types"

interface EventPageProps {
  params: {
    id: string
  }
}

export default function EventPage({ params }: EventPageProps) {
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're offline
    setOffline(isOffline())

    // Add online/offline event listeners
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Load event and messages
    const loadEventData = async () => {
      try {
        let eventData: Event | null = null
        let messageData: Message[] = []

        if (!isOffline()) {
          // Online - fetch from API (mock data in this case)
          eventData = mockEvents.find((e) => e.id === params.id) || null
          messageData = mockMessages.filter((m) => m.eventId === params.id)

          // Save to IndexedDB for offline use
          if (eventData) {
            await saveMessages(messageData)
          }
        } else {
          // Offline - load from IndexedDB
          const events = await getEvents()
          eventData = events.find((e) => e.id === params.id) || null
          if (eventData) {
            messageData = await getMessagesForEvent(params.id)
          }
        }

        setEvent(eventData)
        setMessages(messageData)
      } catch (error) {
        console.error("Error loading event data:", error)
        toast({
          title: "Error",
          description: "Failed to load event data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadEventData()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [params.id, toast])

  // Redirect if someone tries to access /events/create through this route
  if (params.id === "create") {
    return null // This shouldn't happen with proper routing, but added as a safeguard
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="mt-4 text-muted-foreground">Loading event details...</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  const isActive = new Date() >= new Date(event.submissionStartDate) && new Date() <= new Date(event.submissionEndDate)

  const handleDownloadQR = () => {
    toast({
      title: "Feature not implemented",
      description: "QR code download functionality needs to be implemented.",
      variant: "default",
    })
  }

  const handleShare = () => {
    toast({
      title: "Feature not implemented",
      description: "Sharing functionality needs to be implemented.",
      variant: "default",
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {offline && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
          <WifiOff className="h-4 w-4 mr-2" />
          <span className="text-sm">You're offline. Some features may be limited.</span>
        </div>
      )}

      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="relative rounded-lg overflow-hidden h-64 w-full mb-6">
          <Image
            src={event.bannerImage || "/placeholder.svg?height=600&width=1200&query=wedding event"}
            alt={event.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            <div className="flex items-center text-muted-foreground mb-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                Accepting messages: {formatDate(event.submissionStartDate)} - {formatDate(event.submissionEndDate)}
              </span>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Active" : "Inactive"}</Badge>
          </div>

          <div className="flex gap-2">
            <Link href={`/events/${params.id}/edit`}>
              <Button variant="outline" size="sm" disabled={offline}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleDownloadQR} disabled={offline}>
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} disabled={offline}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6 border">
          <TabsTrigger value="all">All Messages ({messages.length})</TabsTrigger>
          <TabsTrigger value="video">Video ({messages.filter((m) => m.mediaType === "video").length})</TabsTrigger>
          <TabsTrigger value="audio">Audio ({messages.filter((m) => m.mediaType === "audio").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {messages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-xl font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground mb-4">
                  Share your QR code with guests to start collecting messages
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="video">
          <div className="space-y-4">
            {messages
              .filter((m) => m.mediaType === "video")
              .map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="space-y-4">
            {messages
              .filter((m) => m.mediaType === "audio")
              .map((message) => (
                <MessageCard key={message.id} message={message} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
