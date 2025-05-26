import { EventEntity } from "@/lib/models";
import { GuestForm } from "@/components/guest-form";

interface GuestPageProps {
  params: Promise<{ code: string }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return e;
};

export default async function GuestPage({ params }: GuestPageProps) {
  const { code } = await params;

  const { data: eventData } = await loadEvent(code);
  if (!eventData) {
    return <div>Event not found</div>;
  }

  const isActive =
    new Date() >= new Date(eventData.submission_start_date) &&
    new Date() <= new Date(eventData.submission_end_date);

  if (!isActive) {
    return <div>Event is not active</div>;
  }
  //TODO: reference package limits from config file
  if (eventData.message_count >= 50) {
    return <div>Event is full</div>;
  }

  return <GuestForm event={eventData} />;
}
