import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import MessageCard from "@/components/message-card";
import { EventButtons } from "@/components/event-buttons";
import { EventVideoControls } from "@/components/event-video-controls";
import { EventEntity, MessageEntity } from "@/lib/models";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return { data: e.data };
};
const loadMessages = async (id: string) =>
  await MessageEntity.query.event({ event_id: id }).go();

export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  let { data: event } = await loadEvent(id);

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
    );
  }

  if (sp.session_id && event.payment_status === "pending") {
    //TODO: Check if the payment was actually successful
    console.log("[EventPage] Session:", sp.session_id);
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        sp.session_id
      );
      console.log("[EventPage] Checkout session:", checkoutSession);
      if (
        checkoutSession.payment_status === "paid" &&
        checkoutSession.metadata?.eventId === id
      ) {
        await EventEntity.patch({ id }).set({ payment_status: "success" }).go();
        event = (await loadEvent(id)).data;
      } else {
        console.log(
          "[EventPage] Payment status is not paid or event id does not match",
          checkoutSession.payment_status,
          checkoutSession.metadata?.eventId,
          id
        );
      }
    } catch (error) {
      console.error("[EventPage] Error checking payment status:", error);
    }
  }

  const { data: messages } = await loadMessages(id);
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
    );
  }

  const isActive =
    new Date() >= new Date(event.submission_start_date) &&
    new Date() <= new Date(event.submission_end_date);

  const eventPaid = event.payment_status === "success";

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="relative rounded-lg overflow-hidden h-64 w-full mb-6">
          <Image
            src={
              event.banner_image || event.payment_status === "pending"
                ? "/placeholder.svg?height=600&width=1200&query=wedding event"
                : "/wedding-ceremony.png"
            }
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
                Accepting messages: {formatDate(event.submission_start_date)} -{" "}
                {formatDate(event.submission_end_date)}
              </span>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <Badge variant={eventPaid ? "default" : "secondary"}>
              {eventPaid ? "Paid" : "Unpaid"}
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <EventButtons
              eventId={id}
            />
            <EventVideoControls
              eventId={id}
              initialHasFinalVideo={!!event.final_video_key}
            />
          </div>
        </div>
      </div>

      {eventPaid ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6 border">
            <TabsTrigger value="all">
              All Messages ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="video">
              Video ({messages.filter((m) => m.media_type === "video").length})
            </TabsTrigger>
            <TabsTrigger value="audio">
              Audio ({messages.filter((m) => m.media_type === "audio").length})
            </TabsTrigger>
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
                .filter((m) => m.media_type === "video")
                .map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="space-y-4">
              {messages
                .filter((m) => m.media_type === "audio")
                .map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <h3>complete payment to share qr code and start collecting messages</h3>
      )}
    </div>
  );
}
