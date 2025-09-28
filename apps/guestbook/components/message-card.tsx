'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Message } from '@/lib/types';
import {
  Mic,
  Video,
  Eye,
  EyeOff,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface MessageCardProps {
  message: Message;
}

export default function MessageCard({ message }: MessageCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleTogglePlayer = async () => {
    if (showPlayer) {
      // Just hide player, keep the stream URL cached
      setShowPlayer(false);
      return;
    }

    // If we already have a stream URL, just show the player
    if (streamUrl) {
      setShowPlayer(true);
      return;
    }

    // Only fetch stream URL if we don't have one yet
    setIsLoading(true);
    setError(null);

    try {
      // Use streaming endpoint instead of pre-signed URL
      const streamingUrl = `/api/media/${message.id}/stream?eventId=${message.event_id}`;
      setStreamUrl(streamingUrl);
      setShowPlayer(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load media';
      console.error('[MessageCard] Error setting up stream:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className='shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center'>
            {message.media_type === 'video' ? (
              <Video className='h-6 w-6 text-muted-foreground' />
            ) : (
              <Mic className='h-6 w-6 text-muted-foreground' />
            )}
          </div>

          <div className='grow min-w-0'>
            <h3 className='font-semibold truncate'>{message.guest_name}</h3>
            {!showPlayer && (
              <p className='text-sm text-muted-foreground capitalize'>
                {message.media_type} message
              </p>
            )}
          </div>

          <div className='flex gap-2 shrink-0'>
            <Button
              size='sm'
              variant='outline'
              onClick={handleTogglePlayer}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : showPlayer ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Download className='h-4 w-4' />
              )}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mt-3 p-2 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-sm text-red-700'>
              Failed to load media: {error}
            </p>
          </div>
        )}

        {/* Native HTML Media Elements - Streaming */}
        {showPlayer && streamUrl && (
          <div className='mt-4'>
            {message.media_type === 'video' ? (
              <video
                src={streamUrl}
                className='w-full aspect-video object-cover rounded-md'
                controls
                autoPlay
                playsInline
                preload='none'
              />
            ) : (
              <audio
                src={streamUrl}
                className='w-full'
                controls
                autoPlay
                preload='none'
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
