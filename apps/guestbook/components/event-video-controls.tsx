'use client';

import { useState } from 'react';
import { FinalVideoDownload } from '@/components/final-video-download';
import { CompileVideoButton } from '@/components/compile-video-button';
import { DeleteFinalVideoButton } from '@/components/delete-final-video-button';

interface EventVideoControlsProps {
  eventId: string;
  initialHasFinalVideo: boolean;
}

export function EventVideoControls({
  eventId,
  initialHasFinalVideo,
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
