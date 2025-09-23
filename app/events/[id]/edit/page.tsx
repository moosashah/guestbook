import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { EventEntity } from "@/lib/models";
import { EditEventDatesForm } from "@/components/edit-event";

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return { data: e.data };
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

  // Find the event by ID
  const { data: event } = await loadEvent(id);

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

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Event Details
      </Link>

      <h1 className="text-3xl font-bold mb-6">Edit Event Dates</h1>

      <EditEventDatesForm event={event} />
    </div>
  );
}
