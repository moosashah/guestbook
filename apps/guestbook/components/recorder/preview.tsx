'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PreviewProps {
  type: 'audio' | 'video';
  className?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  recordedMedia: string | undefined;
  resetRecording: () => void;
  stream: MediaStream | null;
}

const VideoPreview = ({
  videoRef,
  recordedMedia,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  recordedMedia: string | undefined;
}) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.videoHeight > video.videoWidth) {
        setRotation(-90);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () =>
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [videoRef, recordedMedia]);

  return (
    <div className='aspect-video bg-black rounded-md mb-4 overflow-hidden'>
      <video
        ref={videoRef}
        src={recordedMedia || undefined}
        controls
        className='w-full h-full object-cover'
        width='100%'
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </div>
  );
};

const AudioPreview = ({
  audioRef,
  recordedMedia,
}: {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  recordedMedia: string | undefined;
}) => (
  <div className='mb-4'>
    <audio ref={audioRef} src={recordedMedia} controls className='w-full' />
  </div>
);

export const Preview = ({
  type,
  className,
  videoRef,
  audioRef,
  recordedMedia,
  resetRecording,
  stream,
}: PreviewProps) => (
  <div className={cn('border rounded-lg p-6 text-center', className)}>
    {type === 'video' ? (
      <VideoPreview videoRef={videoRef} recordedMedia={recordedMedia} />
    ) : (
      <AudioPreview audioRef={audioRef} recordedMedia={recordedMedia} />
    )}
    <div className='flex justify-center space-x-2'>
      <Button type='button' variant='outline' onClick={resetRecording}>
        <RefreshCw className='h-4 w-4 mr-2' />
        Record Again
      </Button>
    </div>
  </div>
);
