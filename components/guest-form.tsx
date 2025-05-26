"use client";

import { Check, Mic, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaRecorder } from "@/components/media-recorder";
import { useState } from "react";
import { Event } from "@/lib/types";

export function GuestForm({ event }: { event: Event }) {
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [messageBlob, setMessageBlob] = useState<Blob | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real app, we would submit the form data to the server
      // and handle file uploads to S3
      console.log("Guest message to submit:", {
        guestName,
        mediaType,
        messageBlob,
      });

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting message:", error);
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-8 px-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
              <Check className="h-8 w-8" />
            </div>

            <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
            <p className="text-muted-foreground mb-6">
              Your message has been submitted successfully. The happy couple
              will be delighted to receive it!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-8 px-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
            <p className="text-muted-foreground">
              Leave a message for the happy couple
            </p>
          </div>

          {event.welcomeMessage && (
            <div className="mb-6 bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Welcome message from the couple:
              </p>
              <div className="aspect-video bg-black/10 rounded flex items-center justify-center">
                <Mic className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Record Your Message</Label>
              <Tabs
                defaultValue="video"
                onValueChange={(value) =>
                  setMediaType(value as "video" | "audio")
                }
              >
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
                  <MediaRecorder
                    type="video"
                    onRecordingComplete={(blob) => setMessageBlob(blob)}
                    description="Record a video message for the happy couple"
                  />
                </TabsContent>

                <TabsContent value="audio">
                  <MediaRecorder
                    type="audio"
                    onRecordingComplete={(blob) => setMessageBlob(blob)}
                    description="Record an audio message for the happy couple"
                  />
                </TabsContent>
              </Tabs>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !messageBlob || !guestName}
            >
              {isSubmitting ? "Submitting..." : "Submit Message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
