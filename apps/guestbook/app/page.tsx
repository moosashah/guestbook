import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/event-card";
import { GitSHA } from "@/components/git-sha";
import { EventEntity } from "@/lib/models";
import { getBannerImageUrl } from "@/lib/s3.server";
import { auth } from "./actions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const loadEvents = async () =>
  await EventEntity.query
    .byCreator({ creator_id: "moosa123" })
    .where((attr, op) => `${op.eq(attr.deleted_at, 0)}`)
    .go();

export default async function Dashboard() {
  const { data: events } = await loadEvents();
  const subject = await auth();


  if (!subject) {
    redirect("/login");
  }


  // Fetch banner URLs for all events server-side
  const eventsWithBanners = await Promise.all(
    events.map(async (event) => {
      let bannerImageUrl: string | null = null;
      if (event.banner_image) {
        try {
          bannerImageUrl = await getBannerImageUrl(event.banner_image, 3600);
        } catch (error) {
          console.error(`Failed to get banner URL for event ${event.id}:`, error);
        }
      }
      return { ...event, bannerImageUrl };
    })
  );

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsWithBanners.length > 0 ? (
          eventsWithBanners.map((event) => <EventCard key={event.id} event={event} />)
        ) : (
          <div className="col-span-full text-center">
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </div>
      <GitSHA />
    </div>
  );
}
