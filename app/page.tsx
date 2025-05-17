"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/event-card";
import { mockEvents } from "@/lib/mock-data";
import { saveEvents, getEvents, isOffline } from "@/lib/offline-storage";
import type { Event } from "@/lib/types";
import { GitSHA } from "@/components/git-sha";

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we're offline
    setOffline(isOffline());

    // Add online/offline event listeners
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load events
    const loadEvents = async () => {
      try {
        // In a real app, we would fetch from API if online
        if (!isOffline()) {
          // Simulate API fetch with mock data
          const fetchedEvents = mockEvents;
          // Save to IndexedDB for offline use
          await saveEvents(fetchedEvents);
          setEvents(fetchedEvents);
        } else {
          // Load from IndexedDB if offline
          const offlineEvents = await getEvents();
          setEvents(offlineEvents);
        }
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      {offline && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center text-amber-800">
          <WifiOff className="h-4 w-4 mr-2" />
          <span className="text-sm">
            You're offline. Some features may be limited.
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Events</h1>
        <Link href="/create">
          <Button disabled={offline}>
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
            <Button disabled={offline}>
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
