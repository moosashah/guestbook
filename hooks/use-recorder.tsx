import { UseRecorderProps } from "@/lib/types"
import { useState, useEffect, useRef } from "react"

const mimeTypes = {
  audio: ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"],
  video: ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
} as const

export const useRecorder = ({ type }: UseRecorderProps) => {
  const [recordingStatus, setRecordingStatus] = useState<"inactive" | "recording" | "preview">("inactive")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [chunks, setChunks] = useState<Blob[]>([])
  const [recordedMedia, setRecordedMedia] = useState<string>("")
  const [blob, setBlob] = useState<Blob | null>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)

  const mimeType = mimeTypes[type].find(type => MediaRecorder.isTypeSupported(type)) || ""

  const startRecording = async () => {
    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      })
      setStream(userMedia)
    } catch (err) {
      console.error("Error accessing media devices:", err)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorder.current) return

    setRecordingStatus("preview")
    mediaRecorder.current.stop()

    mediaRecorder.current.onstop = () => {
      const recordedBlob = new Blob(chunks, { type: mimeType })
      setRecordedMedia(URL.createObjectURL(recordedBlob))
      setBlob(recordedBlob)
      stream?.getTracks().forEach(track => track.stop())
    }
  }

  const resetRecording = () => {
    setRecordingStatus("inactive")
    setRecordedMedia("")
    setChunks([])
    setStream(null)
    videoRef.current?.removeAttribute("src")
    audioRef.current?.removeAttribute("src")
  }

  useEffect(() => {
    if (!stream) return

    setRecordingStatus("recording")
    const media = new MediaRecorder(stream, { mimeType })
    mediaRecorder.current = media
    mediaRecorder.current.start()
    const localChunks: Blob[] = []

    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        localChunks.push(event.data)
      }
    }
    setChunks(localChunks)

    return () => stream.getTracks().forEach(track => track.stop())
  }, [stream, mimeType])

  return {
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
  }
}
