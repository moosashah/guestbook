"use client"

import { useRecorder } from "@/hooks/use-recorder"
import { Inactive } from "./recorder/inactive"
import { Recording } from "./recorder/recording"
import { Preview } from "./recorder/preview"

interface MediaRecorderProps {
  type: "audio" | "video"
  onRecordingComplete: (blob: Blob) => void
  description: string
  className?: string
}

export const MediaRecorder = ({ type, onRecordingComplete, className, description }: MediaRecorderProps) => {
  const {
    blob,
    audioRef,
    liveVideoRef,
    recordedMedia,
    recordingStatus,
    resetRecording,
    startRecording,
    stopRecording,
    stream,
    videoRef
  } = useRecorder({ type })

  switch (recordingStatus) {
    case "inactive":
      return (
        <Inactive
          type={type}
          description={description}
          className={className}
          liveVideoRef={liveVideoRef}
          startRecording={startRecording}
        />
      )
    case "recording":
      return (
        <Recording
          type={type}
          className={className}
          liveVideoRef={liveVideoRef}
          stopRecording={stopRecording}
          stream={stream}
        />
      )
    case "preview":
      return (
        <Preview
          type={type}
          className={className}
          videoRef={videoRef}
          audioRef={audioRef}
          recordedMedia={recordedMedia}
          resetRecording={resetRecording}
        />
      )
    default:
      return null
  }
}
