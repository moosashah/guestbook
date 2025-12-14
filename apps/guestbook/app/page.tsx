import Link from 'next/link';
import Image from 'next/image';
import { CalendarFold, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import EventCard from '@/components/event-card';
import { EventEntity, MessageEntity } from '@/lib/models';
import { getBannerImageUrl } from '@/lib/s3.server';
import { auth } from './actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const loadEvents = async (userId: string) =>
  await EventEntity.query
    .byCreator({ creator_id: userId })
    .where((attr, op) => `${op.eq(attr.deleted_at, 0)}`)
    .go();

const loadMessages = async (id: string) =>
  await MessageEntity.query.event({ event_id: id }).go();

export default async function Dashboard() {
  const subject = await auth();

  if (!subject) {
    redirect('/login');
  }

  const { data: events } = await loadEvents(subject.id);

  // Fetch banner URLs for all events server-side
  const eventsWithBanners = await Promise.all(
    events.map(async event => {
      let bannerImageUrl: string | null = null;
      let audioMessageCount = 0;
      let videoMessageCount = 0;
      if (event.banner_image) {
        try {
          bannerImageUrl = await getBannerImageUrl(event.banner_image, 3600);
          const { data: messages } = await loadMessages(event.id);
          messages.forEach(m => {
            if (m.media_type === 'audio') {
              audioMessageCount++;
            }
            if (m.media_type === 'video') {
              videoMessageCount++;
            }
          });
        } catch (error) {
          console.error(
            `Failed to get banner URL for event ${event.id}:`,
            error
          );
        }
      }
      return { ...event, bannerImageUrl, audioMessageCount, videoMessageCount };
    })
  );

  return (
    <div className='py-8 px-4 container mx-auto'>
      <div className='flex justify-between items-center mb-8'>
        <div className='flex items-center gap-2'>
          <CalendarFold className='size-6 text-primary' />
          <h1 className='text-xl font-semibold'>My Events</h1>
        </div>
        <Link href='/create'>
          <Button>
            <Plus className='size-4' />
            Create New Event
          </Button>
        </Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {eventsWithBanners.length > 0 &&
          eventsWithBanners.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        <EmptyEventCard />
      </div>
    </div>
  );
}

function EmptyEventCard() {
  return (
    <Card className='h-full overflow-hidden hover:shadow-lg transition-all duration-200 border-[#f0f0f0] border relative flex flex-col'>
      <div className='relative h-48 w-full bg-gradient-to-br from-pink-50 to-purple-50'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <Image
            src='/empty-event.png'
            alt='No events illustration'
            width={200}
            height={120}
            className='object-contain'
          />
        </div>
      </div>
      <CardContent className='pt-6 pb-6 text-center flex-grow'>
        <h3 className='text-xl font-semibold mb-2 text-gray-800'>
          Create New Event!
        </h3>
        <p className='text-muted-foreground mb-4 text-sm leading-relaxed'>
          Click "Create new Event" to add new
          <br />
          Event in your Wedvi account.
        </p>
      </CardContent>
      <CardFooter className='w-full'>
        <Link href='/create' className='w-full'>
          <Button className='bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg w-full'>
            <Plus className='size-4 mr-2' />
            Create new Event
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
