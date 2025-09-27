'use client';

import { useState, useEffect, useRef, SetStateAction, Dispatch } from 'react';

interface UseRecorderProps {
  type: 'audio' | 'video';
  setBlob: Dispatch<SetStateAction<Blob | null>>;
}

const mimeTypes = {
  audio: ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'],
  video: [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ],
} as const;

export const useRecorder = ({ type, setBlob }: UseRecorderProps) => {
  const [recordingStatus, setRecordingStatus] = useState<
    'inactive' | 'recording' | 'preview'
  >('inactive');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [recordedMedia, setRecordedMedia] = useState<string | undefined>(
    undefined
  );
  const [stats, setStats] = useState<any>({});

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

  const mimeType =
    typeof window !== 'undefined'
      ? mimeTypes[type].find(
          type => MediaRecorder && MediaRecorder.isTypeSupported(type)
        ) || ''
      : '';

  const startRecording = async () => {
    if (typeof window === 'undefined' || !navigator?.mediaDevices) {
      console.error('Media devices not available');
      return;
    }

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video:
          type === 'video'
            ? {
                frameRate: { ideal: 30 },
                facingMode: { ideal: 'user' },
              }
            : false,
      });
      setStream(userMedia);
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;

    setRecordingStatus('preview');
    mediaRecorder.current.stop();

    mediaRecorder.current.onstop = () => {
      const recordedBlob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(recordedBlob);
      setRecordedMedia(url);
      setBlob(recordedBlob);

      const ref = type === 'video' ? videoRef : audioRef;

      // Handle duration bug in Chrome
      if (ref.current) {
        const media = ref.current;
        media.src = url;
        media.addEventListener('loadedmetadata', () => {
          if (media.duration === Infinity) {
            media.currentTime = 1e101;
            media.addEventListener(
              'timeupdate',
              () => {
                media.currentTime = 0;
              },
              { once: true }
            );
          }
        });
      }

      console.log({
        recordedBlob,
        chunks,
        mimeType,
        size: recordedBlob.size.toString(),
      });

      setStats({
        blobSize: recordedBlob.size.toString(),
        videoWidth: stream?.getVideoTracks()[0],
        videoHeight: videoRef.current?.videoHeight,
      });
      stream?.getTracks().forEach(track => track.stop());
    };
  };

  const resetRecording = () => {
    setRecordingStatus('inactive');
    setRecordedMedia('');
    setChunks([]);
    setStream(null);
    videoRef.current?.removeAttribute('src');
    audioRef.current?.removeAttribute('src');
  };

  useEffect(() => {
    if (!stream || typeof window === 'undefined' || !MediaRecorder) return;

    setRecordingStatus('recording');
    const media = new MediaRecorder(stream, { mimeType });
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    const localChunks: Blob[] = [];

    mediaRecorder.current.ondataavailable = event => {
      if (event.data.size > 0) {
        localChunks.push(event.data);
      }
    };
    setChunks(localChunks);

    return () => stream.getTracks().forEach(track => track.stop());
  }, [stream, mimeType]);

  return {
    audioRef,
    liveVideoRef,
    recordedMedia,
    recordingStatus,
    resetRecording,
    stats,
    startRecording,
    stopRecording,
    stream,
    videoRef,
  };
};
