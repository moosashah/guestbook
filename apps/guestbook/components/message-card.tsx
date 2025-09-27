"use client";

import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { Mic, Video, Play, Pause, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MediaPlayer } from "@/components/media-player"
import { useMediaPlayer } from "@/hooks/use-media-player"
import { useState } from "react"

interface MessageCardProps {
  message: Message
}

export default function MessageCard({ message }: MessageCardProps) {
  const [showPlayer, setShowPlayer] = useState(false);
  const {
    mediaData,
    isLoading,
    error,
    isPlaying,
    fetchMediaUrl,
    play,
    pause
  } = useMediaPlayer({ messageId: message.id, eventId: message.event_id });

  const handlePlayClick = async () => {
    if (showPlayer && mediaData) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      // First time playing - fetch URL and show player
      const data = await fetchMediaUrl();
      if (data) {
        setShowPlayer(true);
        play();
      }
    }
  };

  const handleClosePlayer = () => {
    setShowPlayer(false);
    pause();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            {message.media_type === "video" ? (
              <Video className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Mic className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div className="grow min-w-0">
            <h3 className="font-semibold truncate">{message.guest_name}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(message.created_at)}</p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={handlePlayClick}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-4 w-4 mr-1" />
                Error
              </>
            ) : showPlayer && isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Play
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">Failed to load media: {error}</p>
          </div>
        )}

        {/* Media Player */}
        {showPlayer && mediaData && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Playing message from {message.guest_name}</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClosePlayer}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            <MediaPlayer
              src={mediaData.url}
              type={mediaData.media_type}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
