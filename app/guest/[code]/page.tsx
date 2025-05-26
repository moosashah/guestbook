import { EventEntity } from "@/lib/models";
import { GuestForm } from "@/components/guest-form";

interface GuestPageProps {
  params: Promise<{ code: string }>;
}

const loadEvent = async (code: string) =>
  await EventEntity.get({ id: code }).go();

export default async function GuestPage({ params }: GuestPageProps) {
  const { code } = await params;

  const { data: eventData } = await loadEvent(code);
  if (!eventData) {
    return <div>Event not found</div>;
  }

  const isActive =
    new Date() >= new Date(eventData.submissionStartDate) &&
    new Date() <= new Date(eventData.submissionEndDate);

  if (!isActive) {
    return <div>Event is not active</div>;
  }
  //TODO: reference package limits from config file
  if (eventData.messageCount >= 50) {
    return <div>Event is full</div>;
  }

  return <GuestForm event={eventData} />;
}
