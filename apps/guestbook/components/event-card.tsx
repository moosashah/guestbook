'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  QrCode,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  AudioLines,
  Video,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatDate } from '@/lib/utils';
import type { Event } from '@/lib/types';

interface EventCardProps {
  event: Event & {
    bannerImageUrl?: string | null;
    audioMessageCount: number;
    videoMessageCount: number;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isActive =
    new Date() >= new Date(event.submission_start_date) &&
    new Date() <= new Date(event.submission_end_date);

  const isCompleted =
    new Date() > new Date(event.submission_end_date) && event.final_video_key;
  const isCompiling =
    new Date() > new Date(event.submission_end_date) && !event.final_video_key;
  const isUpcoming = new Date() < new Date(event.submission_start_date);
  const isPaymentPending = event.payment_status === 'pending';

  const getStatusBadge = () => {
    if (isPaymentPending) {
      return { label: 'Payment Pending', variant: 'outline' as const };
    } else if (isUpcoming) {
      return { label: 'Upcoming', variant: 'secondary' as const };
    } else if (isActive) {
      return { label: 'Active', variant: 'default' as const };
    } else if (isCompiling) {
      return { label: 'Compiling', variant: 'outline' as const };
    } else if (isCompleted) {
      return { label: 'Completed', variant: 'outline' as const };
    } else {
      return { label: 'Unknown Status', variant: 'default' as const };
    }
  };

  const statusBadge = getStatusBadge();

  const handleDownloadQR = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card navigation
    e.stopPropagation();

    setIsDownloading(true);
    try {
      const res = await fetch(`/api/qr-download/${event.id}`);
      const data = await res.json();
      if (!data.url) throw new Error('No presigned URL returned');

      const link = document.createElement('a');
      link.href = data.url;
      link.download = `${event.name}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this event? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/event/${event.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh the page to show updated list
      router.refresh();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Link href={`/events/${event.id}`} className='block h-full cursor-pointer'>
      <Card className='h-full overflow-hidden hover:shadow-lg transition-all duration-200 border-[#f0f0f0] border relative flex flex-col'>
        <div className='relative h-48 w-full'>
          <Image
            src={
              event.bannerImageUrl ||
              (event.payment_status === 'pending'
                ? '/placeholder.svg?height=400&width=600&query=wedding event'
                : '/wedding-ceremony.png')
            }
            alt={event.name}
            fill
            className='object-cover'
          />
          <div className='absolute top-3 left-3'>
            <Badge
              variant={statusBadge.variant}
              className={cn(
                'font-medium',
                statusBadge.label === 'Active' &&
                  'bg-green-100 text-green-800 ',
                statusBadge.label === 'Completed' &&
                  'bg-blue-100 text-blue-800 ',
                statusBadge.label === 'Payment Pending' &&
                  'bg-red-100 text-red-800 ',
                statusBadge.label === 'Upcoming' &&
                  'bg-gray-100 text-gray-800 ',
                statusBadge.label === 'Compiling' &&
                  'bg-yellow-100 text-yellow-800 ',
                statusBadge.label === 'Unknown Status' &&
                  'bg-gray-100 text-gray-800 '
              )}
            >
              {statusBadge.label}
            </Badge>
          </div>

          {/* Dropdown Menu in top right */}
          <div className='absolute top-3 right-3 z-30'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className='size-8 rounded-full bg-white backdrop-blur-sm border-gray-200 hover:bg-primary/90 shadow-sm cursor-pointer'>
                  <MoreVertical className='text-black size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='end'
                className='w-48 z-50'
                sideOffset={5}
                avoidCollisions={true}
              >
                <DropdownMenuItem asChild>
                  <Link
                    href={`/events/${event.id}`}
                    className='flex items-center'
                  >
                    <Eye className='mr-2 size-4' />
                    View Event
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/events/${event.id}/edit`}
                    className='flex items-center'
                  >
                    <Edit className='mr-2 size-4' />
                    Edit Event
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteEvent}
                  disabled={isDeleting}
                  className='text-red-600 focus:text-red-600 focus:bg-red-50'
                >
                  <Trash2 className='mr-2 size-4' />
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardHeader className='pb-0'>
          <div className='text-sm font-medium text-muted-foreground mb-1'>
            {formatDate(event.submission_start_date)}
          </div>
          <CardTitle>{event.name}</CardTitle>
          <CardDescription>{event.description}</CardDescription>
        </CardHeader>
        <CardContent className='pt-4 pb-3 flex-grow'>
          <div className='flex items-center gap-2'>
            <span>
              {isActive ? (
                'Collecting messages'
              ) : event.message_count ? (
                <MessagesComponent
                  audioMessageCount={event.audioMessageCount}
                  videoMessageCount={event.videoMessageCount}
                />
              ) : (
                'No Messages'
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter className='w-full relative z-30'>
          {isPaymentPending ? (
            <Button
              variant='destructive'
              size='sm'
              className='w-full cursor-pointer'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/events/${event.id}/payment`);
              }}
            >
              <CreditCard className='mr-2 size-4' />
              Complete Payment
            </Button>
          ) : isUpcoming || isActive ? (
            <Button
              variant='outline'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                handleDownloadQR(e);
              }}
              disabled={isDownloading}
              className='w-full cursor-pointer'
            >
              {isDownloading ? (
                <>
                  <div className='animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full' />
                  Downloading...
                </>
              ) : (
                <>
                  <QrCode className='mr-2 size-4' />
                  Download QR Code
                </>
              )}
            </Button>
          ) : (
            <Button
              className='w-full cursor-pointer'
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/events/${event.id}`);
              }}
            >
              <Eye className='mr-2 size-4' />
              View Album
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

const MessagesComponent = ({
  audioMessageCount,
  videoMessageCount,
}: {
  audioMessageCount: number;
  videoMessageCount: number;
}) => {
  return (
    <div className='flex flex-col'>
      <div className='flex'>
        <div className='mr-2 text-primary'>
          <Video />
        </div>
        {videoMessageCount > 0 ? videoMessageCount : 'Not included'}
      </div>

      <div className='flex'>
        <span className='bg-[#E1B6C3] rounded-md p-1 mr-2'>
          <AudioLines className='size-4 text-primary' />{' '}
        </span>
        {audioMessageCount > 0 ? audioMessageCount : 'Not included'}
      </div>
    </div>
  );
};
