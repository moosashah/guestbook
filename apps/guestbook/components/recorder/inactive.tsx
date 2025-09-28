'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Mic, Video } from 'lucide-react';

interface InactiveProps {
  type: 'audio' | 'video';
  description: string;
  className?: string;
  liveVideoRef: React.RefObject<HTMLVideoElement | null>;
  startRecording: () => void;
}

export const Inactive = ({
  type,
  description,
  className,
  liveVideoRef,
  startRecording,
}: InactiveProps) => (
  <div className={cn('border rounded-lg p-6 text-center', className)}>
    {type === 'video' ? (
      <Video className='h-12 w-12 mx-auto mb-2 text-primary' />
    ) : (
      <Mic className='h-12 w-12 mx-auto mb-2 text-primary' />
    )}
    <p className='text-sm text-muted-foreground mb-4'>{description}</p>
    <Button type='button' variant='outline' onClick={startRecording}>
      Start Recording
    </Button>
  </div>
);
