"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, Video, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DatePicker } from "@/components/date-picker"
import { MediaRecorder } from "@/components/media-recorder"
import { mockEvents } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface EditEventPageProps {
  params: {
    id: string
  }
}

export default function EditEventPage({ params }: EditEventPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaType, setMediaType] = useState<"video" | "audio">("video")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [welcomeMessageBlob, setWelcomeMessageBlob] = useState<Blob | null>(null)
  const [bannerImage, setBannerImage] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [packageType, setPackageType] = useState("basic")

  // Find the event by ID
  const event = mockEvents.find((e) => e.id === params.id)

  // Load event data
  useEffect(() => {
    if (event) {
      setName(event.name)
      setDescription(event.description || "")
      setStartDate(new Date(event.submissionStartDate))
      setEndDate(new Date(event.submissionEndDate))
      setPackageType(event.package || "basic")

      if (event.bannerImage) {
        setBannerPreview(event.bannerImage)
      }

      if (event.welcomeMessage) {
        setMediaType(event.welcomeMessage.type)
      }
    }
  }, [event])

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerImage(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, we would submit the form data to the server
      // and handle file uploads to S3
      console.log("Form data to update:", {
        id: params.id,
        name,
        description,
        welcomeMessageBlob,
        mediaType,
        bannerImage,
        startDate,
        endDate,
        packageType,
      })

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Event updated",
        description: "Your event has been updated successfully.",
      })

      // Redirect to the event details page
      router.push(`/events/${params.id}`)
    } catch (error) {
      console.error("Error updating event:", error)
      setIsSubmitting(false)

      toast({
        title: "Error",
        description: "Failed to update the event. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href={`/events/${params.id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Event Details
      </Link>

      <h1 className="text-3xl font-bold mb-6">Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John & Sarah's Wedding"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your guests about this event"
                  className="resize-none"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner">Banner Image</Label>
                {bannerPreview ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                    <img
                      src={bannerPreview || "/placeholder.svg"}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-2 bg-white/80"
                      onClick={() => {
                        setBannerPreview(null)
                        setBannerImage(null)
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop an image, or click to browse</p>
                    <Input id="banner" type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("banner")?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Welcome Message</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Record a welcome message for your guests. This will be shown when they scan the QR code.
            </p>

            <Tabs defaultValue={mediaType} onValueChange={(value) => setMediaType(value as "video" | "audio")}>
              <TabsList className="mb-4 border">
                <TabsTrigger value="video">
                  <Video className="mr-2 h-4 w-4" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Mic className="mr-2 h-4 w-4" />
                  Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video">
                <MediaRecorder type="video" onRecordingComplete={(blob) => setWelcomeMessageBlob(blob)} />
                {event.welcomeMessage?.type === "video" && !welcomeMessageBlob && (
                  <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                    <p>Current welcome video is already uploaded. Record a new one to replace it.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="audio">
                <MediaRecorder type="audio" onRecordingComplete={(blob) => setWelcomeMessageBlob(blob)} />
                {event.welcomeMessage?.type === "audio" && !welcomeMessageBlob && (
                  <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                    <p>Current welcome audio is already uploaded. Record a new one to replace it.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Message Submission Period</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set the time period during which guests can submit messages
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker date={startDate} setDate={setStartDate} className="w-full" />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker date={endDate} setDate={setEndDate} className="w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Package</h2>

            <RadioGroup value={packageType} onValueChange={setPackageType} className="space-y-4">
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="flex-1 cursor-pointer">
                  <div className="font-medium">Basic</div>
                  <div className="text-sm text-muted-foreground">Up to 50 messages, 30 days active</div>
                </Label>
                <div className="font-semibold">$29</div>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 border-primary bg-primary/5">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium" className="flex-1 cursor-pointer">
                  <div className="font-medium">Premium</div>
                  <div className="text-sm text-muted-foreground">Up to 200 messages, 90 days active</div>
                </Label>
                <div className="font-semibold">$49</div>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="deluxe" id="deluxe" />
                <Label htmlFor="deluxe" className="flex-1 cursor-pointer">
                  <div className="font-medium">Deluxe</div>
                  <div className="text-sm text-muted-foreground">Unlimited messages, 1 year active</div>
                </Label>
                <div className="font-semibold">$99</div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={`/events/${params.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !startDate || !endDate}>
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
