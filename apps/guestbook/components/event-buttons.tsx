'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Edit, Trash2 } from 'lucide-react';

export function EventButtons({ eventId }: { eventId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      // Fetch the presigned URL from your API
      const res = await fetch(`/api/qr-download/${eventId}`);
      const data = await res.json();
      if (!data.url) throw new Error('No presigned URL returned');

      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      link.download = 'event-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
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
      const res = await fetch(`/api/event/${eventId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete event');
      }

      // Redirect to dashboard after successful deletion
      router.push('/');
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2 flex-wrap'>
        <Link href={`/events/${eventId}/edit`}>
          <Button variant='outline' size='sm'>
            <Edit className='mr-2 h-4 w-4' />
            Edit Event
          </Button>
        </Link>
        <Button
          variant='outline'
          size='sm'
          onClick={handleDownloadQR}
          disabled={isDownloading}
        >
          <Download className='mr-2 h-4 w-4' />
          {isDownloading ? (
            <span className='flex items-center'>
              <svg
                className='animate-spin h-4 w-4 mr-2 text-muted-foreground'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'
                ></path>
              </svg>
            </span>
          ) : (
            'Download QR'
          )}
        </Button>
        <Button
          variant='destructive'
          size='sm'
          onClick={handleDeleteEvent}
          disabled={isDeleting}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          {isDeleting ? 'Deleting...' : 'Delete Event'}
        </Button>
      </div>
    </div>
  );
}
