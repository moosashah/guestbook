'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRCodeModalProps {
  eventId: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function QRCodeModal({ eventId, trigger, className }: QRCodeModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = async (open: boolean) => {
    if (open && !qrCodeUrl) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/qr-download/${eventId}`);
        const data = await response.json();
        if (!data.url) throw new Error('No QR code URL returned');
        setQrCodeUrl(data.url);
      } catch (err) {
        console.error('Failed to load QR code:', err);
        setError('Failed to load QR code');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!qrCodeUrl) return;

    try {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = 'event-qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  const defaultTrigger = (
    <Button variant='outline' size='sm' className={cn('gap-2', className)}>
      <QrCode className='size-4' />
      Show QR Code
    </Button>
  );

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>Event QR Code</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col items-center space-y-4'>
          {isLoading && (
            <div className='flex items-center justify-center h-64 w-64'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            </div>
          )}
          {error && (
            <div className='text-center text-destructive'>
              <p>{error}</p>
            </div>
          )}
          {qrCodeUrl && !isLoading && (
            <>
              <div className='bg-white p-4 rounded-lg shadow-lg'>
                <img
                  src={qrCodeUrl}
                  alt='Event QR Code'
                  className='h-64 w-64 object-contain'
                />
              </div>
              <Button onClick={handleDownload} className='gap-2'>
                <Download className='size-4' />
                Download QR Code
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
