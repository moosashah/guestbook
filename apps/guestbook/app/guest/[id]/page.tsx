import { EventEntity } from "@/lib/models";
import { GuestForm } from "@/components/guest-form";
import { PACKAGE_LIMITS } from "@/lib/consts";

interface GuestPageProps {
  params: Promise<{ id: string }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return e;
};

export default async function GuestPage({ params }: GuestPageProps) {
  const { id } = await params;

  const { data: eventData } = await loadEvent(id);
  if (!eventData) {
    return <div>Event not found</div>;
  }

  const isActive =
    new Date() >= new Date(eventData.submission_start_date) &&
    new Date() <= new Date(eventData.submission_end_date);

  if (!isActive) {
    return <div>Event is not active</div>;
  }

  // Check if event has reached its message limit based on package
  const messageLimit = PACKAGE_LIMITS[eventData.package];
  if (eventData.message_count >= messageLimit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Event is Full</h1>
          <p className="text-gray-600 mb-2">
            This event has reached its maximum capacity of {messageLimit} messages.
          </p>
          <p className="text-sm text-gray-500">
            Current messages: {eventData.message_count}/{messageLimit}
          </p>
        </div>
      </div>
    );
  }

  return <GuestForm event={eventData} />;
}
