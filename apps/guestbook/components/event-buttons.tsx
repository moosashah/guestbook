'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DownloadQrCodeButton({ eventId }: { eventId: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <div className='flex flex-col gap-2 justify-end'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleDownloadQR}
        disabled={isDownloading}
        className={cn('gap-2', isDownloading && 'animate-pulse')}
      >
        <Download className='size-4' />
        Download QR Code
      </Button>
    </div>
  );
}

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
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
    <Button
      variant='destructive'
      size='sm'
      onClick={handleDeleteEvent}
      disabled={isDeleting}
      className={cn('gap-2 cursor-pointer', isDeleting && 'animate-pulse')}
    >
      <Trash2 className='size-4' />
    </Button>
  );
}
