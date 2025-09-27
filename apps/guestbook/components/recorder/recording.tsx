'use client';

import { useEffect } from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecordingProps {
  type: 'audio' | 'video';
  className?: string;
  liveVideoRef: React.RefObject<HTMLVideoElement | null>;
  stopRecording: () => void;
  stream: MediaStream | null;
}

const AudioRecording = () => (
  <div className='h-32 bg-muted rounded-md flex items-center justify-center mb-4'>
    <div className='flex flex-col items-center'>
      <div className='w-4 h-4 rounded-full bg-red-500 animate-pulse mb-2' />
      <span className='text-sm'>Recording...</span>
    </div>
  </div>
);

const VideoRecording = ({
  liveVideoRef,
}: {
  liveVideoRef: React.RefObject<HTMLVideoElement | null>;
}) => (
  <div className='aspect-square bg-black rounded-md mb-4 overflow-hidden'>
    <video
      ref={liveVideoRef}
      autoPlay
      playsInline
      muted
      className='w-full h-full object-cover'
    />
  </div>
);

export const Recording = ({
  type,
  className,
  liveVideoRef,
  stopRecording,
  stream,
}: RecordingProps) => {
  useEffect(() => {
    if (type === 'video' && stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
    return () => {
      liveVideoRef.current?.removeAttribute('srcObject');
    };
  }, [stream, type, liveVideoRef]);

  return (
    <div className={cn('border rounded-lg p-6 text-center', className)}>
      {type === 'video' ? (
        <VideoRecording liveVideoRef={liveVideoRef} />
      ) : (
        <AudioRecording />
      )}
      <Button
        type='button'
        variant='outline'
        onClick={stopRecording}
        className='bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200'
      >
        <Square className='h-4 w-4 mr-2' />
        Stop Recording
      </Button>
    </div>
  );
};
