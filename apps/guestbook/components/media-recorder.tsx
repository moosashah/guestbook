'use client';

import { useRecorder } from '@/hooks/use-recorder';
import { Inactive } from './recorder/inactive';
import { Recording } from './recorder/recording';
import { Preview } from './recorder/preview';
import { Error } from './recorder/error';
import { Dispatch, SetStateAction } from 'react';

interface MediaRecorderProps {
  type: 'audio' | 'video';
  setBlob: Dispatch<SetStateAction<Blob | null>>;
  description: string;
  className?: string;
}

export const MediaRecorder = ({
  type,
  setBlob,
  className,
  description,
}: MediaRecorderProps) => {
  const {
    audioRef,
    error,
    liveVideoRef,
    recordedMedia,
    recordingStatus,
    resetRecording,
    retryPermission,
    startRecording,
    stopRecording,
    stream,
    videoRef,
  } = useRecorder({ type, setBlob });

  switch (recordingStatus) {
    case 'inactive':
      return (
        <Inactive
          type={type}
          description={description}
          className={className}
          liveVideoRef={liveVideoRef}
          startRecording={startRecording}
        />
      );
    case 'recording':
      return (
        <Recording
          type={type}
          className={className}
          liveVideoRef={liveVideoRef}
          stopRecording={stopRecording}
          stream={stream}
        />
      );
    case 'preview':
      return (
        <Preview
          type={type}
          className={className}
          videoRef={videoRef}
          audioRef={audioRef}
          recordedMedia={recordedMedia}
          resetRecording={resetRecording}
          stream={stream}
        />
      );
    case 'error':
      return error ? (
        <Error
          type={type}
          className={className}
          error={error}
          retryPermission={retryPermission}
          resetRecording={resetRecording}
        />
      ) : null;
    default:
      return null;
  }
};
