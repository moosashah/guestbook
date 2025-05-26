"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PreviewProps {
  type: "audio" | "video"
  className?: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  audioRef: React.RefObject<HTMLAudioElement | null>
  recordedMedia: string
  resetRecording: () => void
}

const VideoPreview = ({ videoRef, recordedMedia }: { videoRef: React.RefObject<HTMLVideoElement | null>, recordedMedia: string }) => (
  <div className="aspect-video bg-black rounded-md mb-4 overflow-hidden">
    <video ref={videoRef} src={recordedMedia} controls className="w-full h-full object-cover" />
  </div>
)

const AudioPreview = ({ audioRef, recordedMedia }: { audioRef: React.RefObject<HTMLAudioElement | null>, recordedMedia: string }) => (
  <div className="mb-4">
    <audio ref={audioRef} src={recordedMedia} controls className="w-full" />
  </div>
)

export const Preview = ({
  type,
  className,
  videoRef,
  audioRef,
  recordedMedia,
  resetRecording
}: PreviewProps) => (
  <div className={cn("border rounded-lg p-6 text-center", className)}>
    {type === "video" ? (
      <VideoPreview videoRef={videoRef} recordedMedia={recordedMedia} />
    ) : (
      <AudioPreview audioRef={audioRef} recordedMedia={recordedMedia} />
    )}
    <div className="flex justify-center space-x-2">
      <Button type="button" variant="outline" onClick={resetRecording}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Record Again
      </Button>
    </div>
  </div>
)
