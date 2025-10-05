import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, cn } from '@/lib/utils';
import MessageCard from '@/components/message-card';
import { DeleteEventButton, QRPreviewButton } from '@/components/event-buttons';
import { EventVideoControls } from '@/components/event-video-controls';
import { EventEntity, MessageEntity } from '@/lib/models';
import { getBannerImageUrl } from '@/lib/s3.server';
import { auth } from '../../actions';
import { redirect } from 'next/navigation';
import { isAuthorizedForEvent } from '@/lib/auth.server';
import { PACKAGE_MEDIA_OPTIONS } from '@/lib/consts';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return { data: e.data };
};
const loadMessages = async (id: string) =>
  await MessageEntity.query.event({ event_id: id }).go();

export default async function EventPage({
  params,
  searchParams,
}: EventPageProps) {
  const { id } = await params;
  const sp = await searchParams;

  // Check authentication
  const subject = await auth();
  if (!subject) {
    redirect('/login');
  }

  // Check authorization
  const authorized = await isAuthorizedForEvent(subject.properties, id);
  if (!authorized) {
    return (
      <div className='container mx-auto py-8 px-4 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
        <p className='text-muted-foreground mb-4'>
          You don't have permission to access this event.
        </p>
        <Link href='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  let { data: event } = await loadEvent(id);

  if (!event) {
    return (
      <div className='container mx-auto py-8 px-4 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Event not found</h1>
        <Link href='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch banner image URL server-side if banner exists
  let bannerImageUrl: string | null = null;
  if (event.banner_image) {
    try {
      bannerImageUrl = await getBannerImageUrl(event.banner_image, 3600); // 1 hour expiry
    } catch (error) {
      console.error('[EventPage] Failed to get banner image URL:', error);
    }
  }

  if (sp.session_id && event.payment_status === 'pending') {
    //TODO: Check if the payment was actually successful
    console.log('[EventPage] Session:', sp.session_id);
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(
        sp.session_id
      );
      console.log('[EventPage] Checkout session:', checkoutSession);
      if (
        checkoutSession.payment_status === 'paid' &&
        checkoutSession.metadata?.eventId === id &&
        checkoutSession.metadata?.package
      ) {
        await EventEntity.patch({ id })
          .set({
            payment_status: 'success',
            package: checkoutSession.metadata?.package as
              | 'basic'
              | 'deluxe'
              | 'premium',
          })
          .go();
        event = (await loadEvent(id)).data;
      } else {
        console.log(
          '[EventPage] Payment status is not paid or event id does not match',
          checkoutSession.payment_status,
          checkoutSession.metadata?.eventId,
          id
        );
      }
    } catch (error) {
      console.error('[EventPage] Error checking payment status:', error);
    }
  }

  const { data: messages } = await loadMessages(id);
  if (!event) {
    return (
      <div className='container mx-auto py-8 px-4 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Event not found</h1>
        <Link href='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(event.submission_start_date);
  const endDate = new Date(event.submission_end_date);

  const isUpcoming = now < startDate;
  const isActive = now >= startDate && now <= endDate;
  const isCompleted = now > endDate;
  const hasFinalVideo = !!event.final_video_key;

  const getStatusBadge = () => {
    if (isUpcoming) return { label: 'Upcoming', variant: 'secondary' as const };
    if (isActive) return { label: 'Active', variant: 'default' as const };
    if (isCompleted && !hasFinalVideo)
      return { label: 'Compiling', variant: 'outline' as const };
    if (isCompleted && hasFinalVideo)
      return { label: 'Completed', variant: 'outline' as const };
    return { label: 'Error', variant: 'default' as const };
  };

  const statusBadge = getStatusBadge();
  const eventPaid = event.payment_status === 'success';

  const audioMessages = messages.filter(m => m.media_type === 'audio');
  const videoMessages = messages.filter(m => m.media_type === 'video');

  // Get available media options based on package
  const mediaOptions = PACKAGE_MEDIA_OPTIONS[event.package];
  const hasVideoSupport = (mediaOptions as readonly string[]).includes('video');

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <Link
            href='/'
            className='flex items-center text-sm text-primary/60 hover:text-primary'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            Back to Dashboard
          </Link>
          <div className='flex items-center flex-row gap-4'>
            <Button
              variant='outline'
              className='text-primary/60 hover:text-white bg-white hover:bg-primary/90'
              size='icon'
              asChild
            >
              <Link href={`/events/${id}/edit`}>
                <Edit className='size-4' />
              </Link>
            </Button>
            <DeleteEventButton eventId={id} />
          </div>
        </div>

        <div className='relative rounded-lg overflow-hidden h-64 w-full mb-6'>
          {/* TODO: Remove this debug logging for production */}
          <Link href={`/guest/${id}`}>
            <Image
              src={
                bannerImageUrl ||
                (event.payment_status === 'pending'
                  ? '/placeholder.svg?height=600&width=1200&query=wedding event'
                  : '/wedding-ceremony.png')
              }
              alt={event.name}
              fill
              className='object-cover'
            />
          </Link>
          <div className='absolute top-3 left-3 flex gap-2'>
            <Badge
              variant={statusBadge.variant}
              className={cn(
                'font-medium',
                statusBadge.label === 'Active' &&
                  'bg-green-100 text-green-800 hover:bg-green-200',
                statusBadge.label === 'Completed' &&
                  'bg-blue-100 text-blue-800 hover:bg-blue-200',
                statusBadge.label === 'Compiling' &&
                  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
                statusBadge.label === 'Upcoming' &&
                  'bg-gray-100 text-gray-800 hover:bg-gray-200',
                statusBadge.label === 'Error' &&
                  'bg-red-100 text-red-800 hover:bg-red-200'
              )}
            >
              {statusBadge.label}
            </Badge>
            <Badge
              variant={eventPaid ? 'default' : 'secondary'}
              className={cn(
                'font-medium capitalize',
                eventPaid && 'bg-green-100 text-green-800 hover:bg-green-200',
                !eventPaid && 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              )}
            >
              {eventPaid ? event.package : 'Unpaid'}
            </Badge>
          </div>
        </div>

        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
          <div>
            <div className='flex items-center text-muted-foreground mb-2 gap-2'>
              <Calendar className='size-4' />
              <p>
                Accepting messages: {formatDate(event.submission_start_date)} -{' '}
                {formatDate(event.submission_end_date)}
              </p>
            </div>
            <h1 className='text-3xl mb-2'>{event.name}</h1>
          </div>

          <div className='flex flex-col gap-2'>
            <QRPreviewButton eventId={id} />
            <EventVideoControls
              eventId={id}
              initialHasFinalVideo={!!event.final_video_key}
              event={event}
            />
          </div>
        </div>
      </div>

      {eventPaid ? (
        hasVideoSupport ? (
          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='mb-6 border'>
              <TabsTrigger value='all'>
                All Messages ({messages.length})
              </TabsTrigger>
              <TabsTrigger value='video'>
                Video ({videoMessages.length})
              </TabsTrigger>
              <TabsTrigger value='audio'>
                Audio ({audioMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value='all'>
              {messages.length === 0 ? (
                <Card>
                  <CardContent className='text-center py-12'>
                    <h3 className='text-xl font-medium mb-2'>
                      No messages yet
                    </h3>
                    <p className='text-muted-foreground mb-4'>
                      Share your QR code with guests to start collecting
                      messages
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {messages.map(message => (
                    <MessageCard key={message.id} message={message} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='video'>
              {videoMessages.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {videoMessages.map(message => (
                    <MessageCard key={message.id} message={message} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className='text-center py-12'>
                    <h3 className='text-xl font-medium mb-2'>
                      No video messages yet
                    </h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value='audio'>
              {audioMessages.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {audioMessages.map(message => (
                    <MessageCard key={message.id} message={message} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className='text-center py-12'>
                    <h3 className='text-xl font-medium mb-2'>
                      No audio messages yet
                    </h3>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          // For basic/premium packages - show all messages (should only be audio) without tabs
          <div>
            <div className='mb-6'>
              <h2 className='text-xl font-semibold mb-4'>
                Messages ({messages.length})
              </h2>
            </div>
            {messages.length === 0 ? (
              <Card>
                <CardContent className='text-center py-12'>
                  <h3 className='text-xl font-medium mb-2'>No messages yet</h3>
                  <p className='text-muted-foreground mb-4'>
                    Share your QR code with guests to start collecting messages
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {messages.map(message => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </div>
            )}
          </div>
        )
      ) : (
        <Card>
          <CardContent className='text-center py-12'>
            <h3 className='text-2xl font-medium mb-2'>
              Complete Your Purchase
            </h3>
            <p className='text-muted-foreground mb-6'>
              Complete payment to activate your event and start collecting
              messages from guests
            </p>
            <Button asChild size='lg'>
              <Link href={`/events/${id}/payment`}>Purchase Package</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
