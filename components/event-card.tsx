"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const isActive =
    new Date() >= new Date(event.submissionStartDate) &&
    new Date() <= new Date(event.submissionEndDate);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow border-[#f0f0f0] border">
        <div className="relative h-48 w-full">
          <Image
            src={
              event.bannerImage ||
              "/placeholder.svg?height=400&width=600&query=wedding event"
            }
            alt={event.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`font-medium ${
                isActive
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <CardContent className="pt-4 pb-4">
          <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
          <div className="flex items-center text-sm text-muted-foreground mb-1">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {formatDate(event.submissionStartDate)} -{" "}
              {formatDate(event.submissionEndDate)}
            </span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>{event.messageCount || 0} messages</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
