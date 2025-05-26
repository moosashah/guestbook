"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Video, Square, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MediaRecorderProps {
  type: "audio" | "video"
  onRecordingComplete: (blob: Blob) => void
  description: string
  className?: string
}

export function MediaRecorder({ type, onRecordingComplete, className, description }: MediaRecorderProps) {
  const [permission, setPermission] = useState<boolean>(false)
  const [recordingStatus, setRecordingStatus] = useState<"inactive" | "recording" | "paused" | "preview">("inactive")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordedMedia, setRecordedMedia] = useState<string | null>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)

  const getMicrophonePermission = async () => {
    try {
      const streamData = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      })
      setPermission(true)
      setStream(streamData)

      if (type === "video" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = streamData
      }
    } catch (err) {
      console.error("Error accessing media devices:", err)
    }
  }

  const startRecording = () => {
    if (!stream) return

    setRecordingStatus("recording")

    const media = new window.MediaRecorder(stream)
    mediaRecorder.current = media
    mediaRecorder.current.start()

    const localAudioChunks: Blob[] = []
    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        localAudioChunks.push(event.data)
      }
    }

    setAudioChunks(localAudioChunks)
  }

  const stopRecording = () => {
    if (!mediaRecorder.current) return

    setRecordingStatus("preview")
    mediaRecorder.current.stop()

    mediaRecorder.current.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: type === "video" ? "video/webm" : "audio/webm" })
      const mediaUrl = URL.createObjectURL(audioBlob)
      setRecordedMedia(mediaUrl)
      onRecordingComplete(audioBlob)

      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const resetRecording = () => {
    setRecordingStatus("inactive")
    setRecordedMedia(null)
    setAudioChunks([])
    setStream(null)
    if (videoRef.current) videoRef.current.src = ""
    if (audioRef.current) audioRef.current.src = ""
  }

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  if (!permission) {
    return (
      <div className={cn("border rounded-lg p-6 text-center", className)}>
        {type === "video" ? (
          <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        ) : (
          <Mic className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        <Button type="button" variant="outline" onClick={getMicrophonePermission}>
          Allow {type === "video" ? "Camera" : "Microphone"} Access
        </Button>
      </div>
    )
  }

  if (recordingStatus === "inactive") {
    return (
      <div className={cn("border rounded-lg p-6 text-center", className)}>
        {type === "video" ? (
          <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        ) : (
          <Mic className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground mb-4">
          {type === "video" ? "Record a video message for your guests" : "Record an audio message for your guests"}
        </p>
        <Button type="button" variant="outline" onClick={startRecording}>
          Start Recording
        </Button>
      </div>
    )
  }

  if (recordingStatus === "recording") {
    return (
      <div className={cn("border rounded-lg p-6 text-center", className)}>
        {type === "video" ? (
          <div className="aspect-video bg-black rounded-md mb-4 overflow-hidden">
            <video ref={liveVideoRef} autoPlay muted className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="h-32 bg-muted rounded-md flex items-center justify-center mb-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse mb-2"></div>
              <span className="text-sm">Recording...</span>
            </div>
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={stopRecording}
          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
        >
          <Square className="h-4 w-4 mr-2" />
          Stop Recording
        </Button>
      </div>
    )
  }

  if (recordingStatus === "preview") {
    return (
      <div className={cn("border rounded-lg p-6 text-center", className)}>
        {type === "video" ? (
          <div className="aspect-video bg-black rounded-md mb-4 overflow-hidden">
            <video ref={videoRef} src={recordedMedia || undefined} controls className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="mb-4">
            <audio ref={audioRef} src={recordedMedia || undefined} controls className="w-full" />
          </div>
        )}
        <div className="flex justify-center space-x-2">
          <Button type="button" variant="outline" onClick={resetRecording}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Record Again
          </Button>
        </div>
      </div>
    )
  }

  return null
}
