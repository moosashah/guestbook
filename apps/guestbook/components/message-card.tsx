'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Message } from '@/lib/types';
import { Mic, Video, Download, Loader2, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface MessageCardProps {
  message: Message;
}

export default function MessageCard({ message }: MessageCardProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize stream URL on component mount
  useEffect(() => {
    const streamingUrl = `/api/media/${message.id}/stream?eventId=${message.event_id}`;
    setStreamUrl(streamingUrl);
  }, [message.id, message.event_id]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Fetch the presigned download URL from API
      const res = await fetch(
        `/api/media/${message.id}/download?eventId=${message.event_id}`
      );
      const data = await res.json();
      if (!data.url) throw new Error('No presigned URL returned');

      // Trigger download
      const link = document.createElement('a');
      link.href = data.url;
      const fileExtension = message.media_type === 'video' ? 'webm' : 'wav';
      link.download = `${message.guest_name}-${message.media_type}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('[MessageCard] Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download media');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className='overflow-hidden'>
      <CardContent className='p-4'>
        <div className='flex items-center gap-4'>
          <h3 className='font-semibold truncate'>{message.guest_name}</h3>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mb-3 p-2 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-700'>
              Failed to load media: {error}
            </p>
          </div>
        )}

        {streamUrl && (
          <div className='mb-4'>
            {message.media_type === 'video' ? (
              <video
                src={streamUrl}
                className='w-full aspect-video object-cover rounded-md bg-gray-100'
                controls
                playsInline
                preload='metadata'
              />
            ) : (
              <div className='relative'>
                {/* Audio Visual Background */}
                <div className='w-full aspect-video bg-primary rounded-md flex items-center justify-center'>
                  <div className='bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-lg'>
                    <AudioLines className='size-10 text-white' />
                  </div>
                </div>
                {/* Audio Controls - Positioned absolutely at bottom */}
                <audio
                  src={streamUrl}
                  className='absolute bottom-0 left-0 w-full rounded-b-md'
                  controls
                  preload='metadata'
                />
              </div>
            )}
          </div>
        )}

        {/* Download Button */}
        <Button
          size='sm'
          variant='outline'
          onClick={handleDownload}
          disabled={isDownloading}
          className='w-full'
        >
          {isDownloading ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Downloading...
            </>
          ) : (
            <>
              <Download className='h-4 w-4 mr-2' />
              Download {message.media_type}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
