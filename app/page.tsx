"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/event-card";
import { mockEvents } from "@/lib/mock-data";
import type { Event } from "@/lib/types";
import { GitSHA } from "@/components/git-sha";

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // In a real app, we would fetch from API
        const fetchedEvents = mockEvents;
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Events</h1>
        <Link href="/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-muted-foreground">Loading your events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first event to start collecting memories
          </p>
          <Link href="/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Your First Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
      <GitSHA />
    </div>
  );
}
