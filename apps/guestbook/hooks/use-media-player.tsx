'use client';

import { useState, useCallback } from 'react';

interface MediaData {
  url: string;
  media_type: 'audio' | 'video';
  expires_in: number;
}

interface UseMediaPlayerProps {
  messageId: string;
  eventId?: string;
}

export const useMediaPlayer = ({ messageId, eventId }: UseMediaPlayerProps) => {
  const [mediaData, setMediaData] = useState<MediaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchMediaUrl = useCallback(async () => {
    if (mediaData && mediaData.url) {
      // If we already have a valid URL, don't fetch again
      return mediaData;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(
        `[use-media-player] Fetching media URL for message: ${messageId}`
      );

      // Use query parameter for eventId if available for more efficient lookup
      const endpoint = eventId
        ? `/api/media/${messageId}?eventId=${eventId}`
        : `/api/media/${messageId}`;

      const response = await fetch(endpoint);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: MediaData = await response.json();
      console.log(
        `[use-media-player] Successfully fetched media URL for message: ${messageId}`
      );

      setMediaData(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch media URL';
      console.error(`[use-media-player] Error fetching media URL:`, err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messageId, eventId, mediaData]);

  const play = useCallback(async () => {
    if (!mediaData) {
      await fetchMediaUrl();
    }
    setIsPlaying(true);
  }, [mediaData, fetchMediaUrl]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setMediaData(null);
    setIsPlaying(false);
    setError(null);
  }, []);

  return {
    mediaData,
    isLoading,
    error,
    isPlaying,
    fetchMediaUrl,
    play,
    pause,
    reset,
  };
};
