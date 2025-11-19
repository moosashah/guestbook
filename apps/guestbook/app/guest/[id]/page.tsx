import { EventEntity } from '@/lib/models';
import { GuestForm } from '@/components/guest-form';
import {
  PACKAGE_LIMITS,
  PACKAGE_MEDIA_OPTIONS,
  PackageMediaOption,
} from '@/lib/consts';
import Image from 'next/image';
import Link from 'next/link';
import { Event } from '@/lib/types';
import { getBannerImageUrl, getWelcomeMessageUrl } from '@/lib/s3.server';
import { Card, CardContent } from '@/components/ui/card';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit Message',
  description: 'Collect and cherish wedding memories from your guests',
};

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
    return (
      <Image
        src='/wedding-event-not-found.png'
        alt='Event not found'
        width={800}
        height={800}
        className='object-cover rounded-lg'
      />
    );
  }

  // Check if payment is still pending
  if (eventData.payment_status === 'pending') {
    return (
      <div className='flex items-center justify-center bg-muted/20 p-4'>
        <Card className='w-full max-w-md text-center bg-destructive/10 border-destructive'>
          <CardContent className='pt-4 pb-8 px-6'>
            <h1 className='text-2xl font-bold mb-4 text-destructive'>
              Event Creation Not Complete
            </h1>
            <p className='text-destructive/80 mb-4'>
              This event is still being set up.
            </p>
            <p className='text-sm text-destructive/80'>
              Please check back later or contact the event organizer for more
              information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let bannerImageUrl: string | null = null;
  if (eventData.banner_image) {
    try {
      bannerImageUrl = await getBannerImageUrl(eventData.banner_image, 3600);
    } catch (error) {
      console.error('[GuestPage] Failed to get banner image URL:', error);
    }
  }

  let welcomeMessageUrl: string | null = null;
  if (eventData.welcome_message) {
    try {
      welcomeMessageUrl = await getWelcomeMessageUrl(
        eventData.welcome_message,
        3600
      );
    } catch (error) {
      console.error('[GuestPage] Failed to get welcome message URL:', error);
    }
  }

  const now = new Date();
  const submissionStartDate = new Date(eventData.submission_start_date);
  const submissionEndDate = new Date(eventData.submission_end_date);

  const isUpcoming = now < submissionStartDate;
  const isActive = now >= submissionStartDate && now <= submissionEndDate;

  const messageLimit = PACKAGE_LIMITS[eventData.package];

  return (
    <div className='flex flex-col w-full items-center justify-center'>
      <TopSection
        event={eventData}
        bannerImageUrl={bannerImageUrl}
        welcomeMessageUrl={welcomeMessageUrl}
      />
      {isActive ? (
        eventData.message_count >= messageLimit ? (
          <div className='flex items-center justify-center bg-muted/20 p-4'>
            <Card className='w-full max-w-md text-center bg-destructive/10 border-destructive'>
              <CardContent className='pt-4 pb-8 px-6'>
                <h1 className='text-2xl font-bold mb-4 text-destructive'>
                  Event is Full
                </h1>
                <p className='text-destructive/80'>
                  This event has reached its maximum capacity of messages.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <GuestForm
            event={eventData}
            mediaOptions={
              PACKAGE_MEDIA_OPTIONS[
                eventData.package
              ] as unknown as PackageMediaOption[]
            }
          />
        )
      ) : isUpcoming ? (
        <div className='flex items-center justify-center bg-muted/20 p-4'>
          <Card className='w-full max-w-md text-center bg-destructive/10 border-destructive'>
            <CardContent className='pt-4 pb-8 px-6'>
              <h1 className='text-2xl font-bold mb-4 text-destructive'>
                Event Not Started
              </h1>
              <p className='text-destructive/80 mb-4'>
                The message submission period for this event hasn't begun yet.
                Please check back later when the event is active.
              </p>
              <p className='text-sm text-destructive/80'>
                The happy couple will let you know when you can start leaving
                your messages!
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className='flex items-center justify-center bg-muted/20 p-4'>
          <Card className='w-full max-w-md text-center bg-destructive/10 border-destructive'>
            <CardContent className='pt-4 pb-8 px-6'>
              <h1 className='text-2xl font-bold mb-4 text-destructive'>
                Submissions Closed
              </h1>
              <p className='text-destructive/80 mb-4'>
                The message submission period for this event has ended. You can
                no longer send messages for this event.
              </p>
              <p className='text-sm text-destructive/80'>
                Thank you for your interest! The couple will cherish all the
                messages they received.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TopSection({
  event,
  bannerImageUrl,
  welcomeMessageUrl,
}: {
  event: Event;
  bannerImageUrl: string | null;
  welcomeMessageUrl: string | null;
}) {
  return (
    <div className='flex flex-col items-center w-full justify-center'>
      <div className='text-center mb-6'>
        {/* TODO: Remove this link for production */}
        <Link href={`/events/${event.id}`}>
          <h1 className='text-2xl mb-2'>{event.name}</h1>
          {bannerImageUrl && (
            <Image
              src={bannerImageUrl}
              alt={event.name}
              width={600}
              height={600}
              className='object-cover rounded-lg'
            />
          )}
        </Link>
        <p className='text-muted-foreground pt-4'>{event.description}</p>
        {/* TODO: Remove this for production */}
        <div className='mt-2 text-sm text-muted-foreground'>
          Messages: {event.message_count}/{PACKAGE_LIMITS[event.package]}
        </div>
      </div>

      {welcomeMessageUrl && (
        <audio src={welcomeMessageUrl} controls className='w-full' />
      )}
    </div>
  );
}
