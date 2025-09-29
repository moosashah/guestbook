'use client';

import { useState } from 'react';
import { FinalVideoDownload } from '@/components/final-video-download';
import { CompileVideoButton } from '@/components/compile-video-button';
import { DeleteFinalVideoButton } from '@/components/delete-final-video-button';
import { Event } from '@guestbook/shared';

interface EventVideoControlsProps {
  eventId: string;
  initialHasFinalVideo: boolean;
  event: Event;
}

export function EventVideoControls({
  eventId,
  initialHasFinalVideo,
  event,
}: EventVideoControlsProps) {
  const [hasFinalVideo, setHasFinalVideo] = useState(initialHasFinalVideo);

  const handleCompilationComplete = () => {
    setHasFinalVideo(true);
  };

  const handleVideoDeleted = () => {
    setHasFinalVideo(false);
  };

  return (
    <div className='flex flex-col gap-2'>
      <CompileVideoButton
        eventId={eventId}
        hasFinalVideo={hasFinalVideo}
        onCompilationComplete={handleCompilationComplete}
        disabled={event.message_count === 0}
      />

      <div className='flex flex-col sm:flex-row gap-2'>
        <FinalVideoDownload eventId={eventId} hasFinalVideo={hasFinalVideo} />

        <DeleteFinalVideoButton
          eventId={eventId}
          hasFinalVideo={hasFinalVideo}
          onVideoDeleted={handleVideoDeleted}
        />
      </div>
    </div>
  );
}
