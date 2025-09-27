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
import { formatDate } from '@/lib/utils';
import type { Event } from '@/lib/types';

interface EventCardProps {
  event: Event & { bannerImageUrl?: string | null };
}

export default function EventCard({ event }: EventCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isActive =
    new Date() >= new Date(event.submission_start_date) &&
    new Date() <= new Date(event.submission_end_date);

  const isCompleted = new Date() > new Date(event.submission_end_date);
  const isUpcoming = new Date() < new Date(event.submission_start_date);

  const getStatusBadge = () => {
    if (isUpcoming) return { label: 'Upcoming', variant: 'secondary' as const };
    if (isCompleted) return { label: 'Completed', variant: 'outline' as const };
    return { label: 'Active', variant: 'default' as const };
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
    <Card className='h-full overflow-hidden hover:shadow-lg transition-all duration-200 border-[#f0f0f0] border relative'>
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
            className={`font-medium ${
              statusBadge.label === 'Active'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : statusBadge.label === 'Completed'
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {statusBadge.label}
          </Badge>
        </div>

        {/* Dropdown Menu in top right */}
        <div className='absolute top-3 right-3 z-20'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='h-8 w-8 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm'
              >
                <MoreVertical className='h-4 w-4' />
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
                  <Eye className='mr-2 h-4 w-4' />
                  View Event
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/events/${event.id}/edit`}
                  className='flex items-center'
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Edit Event
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className='text-red-600 focus:text-red-600 focus:bg-red-50'
              >
                <Trash2 className='mr-2 h-4 w-4' />
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
      <CardContent className='pt-4 pb-3'>
        <div className='flex items-center gap-2'>
          <MessageSquare className='size-4' />
          <span>
            {event.message_count
              ? `${event.message_count} Messages`
              : 'No Messages'}
          </span>
        </div>
      </CardContent>
      <CardFooter className='w-full'>
        {/* QR Download Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleDownloadQR}
          disabled={isDownloading}
          className='w-full'
        >
          {isDownloading ? (
            <>
              <div className='animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full' />
              Downloading...
            </>
          ) : (
            <>
              <QrCode className='mr-2 h-4 w-4' />
              Download QR Code
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
