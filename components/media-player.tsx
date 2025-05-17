"use client"

import type React from "react"

import { useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MediaPlayerProps {
  src: string
  type: "audio" | "video"
  className?: string
}

export function MediaPlayer({ src, type, className }: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!mediaRef.current) return

    if (isPlaying) {
      mediaRef.current.pause()
    } else {
      mediaRef.current.play()
    }

    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!mediaRef.current) return

    mediaRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    if (!mediaRef.current) return

    const newVolume = value[0]
    mediaRef.current.volume = newVolume
    setVolume(newVolume)

    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return

    setCurrentTime(mediaRef.current.currentTime)

    if (mediaRef.current.ended) {
      setIsPlaying(false)
    }
  }

  const handleSeek = (value: number[]) => {
    if (!mediaRef.current) return

    const seekTime = value[0]
    mediaRef.current.currentTime = seekTime
    setCurrentTime(seekTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  useEffect(() => {
    const media = mediaRef.current

    if (!media) return

    const handleLoadedMetadata = () => {
      setDuration(media.duration)
    }

    media.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      media.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [src])

  return (
    <div className={cn("rounded-md overflow-hidden", className)}>
      {type === "video" ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          className="w-full aspect-video object-cover"
          onTimeUpdate={handleTimeUpdate}
        />
      ) : (
        <audio
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={src}
          className="hidden"
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      <div className="bg-muted p-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
