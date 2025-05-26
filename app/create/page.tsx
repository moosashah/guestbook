"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker } from "@/components/date-picker";
import { MediaRecorder } from "@/components/media-recorder";
import { useForm } from "react-hook-form";
import { loadStripe } from "@stripe/stripe-js";

interface FormValues {
  name: string;
  description?: string;
  submissionStartDate?: Date;
  submissionEndDate?: Date;
  package: string;
}

export default function CreateEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [welcomeMessageBlob, setWelcomeMessageBlob] = useState<Blob | null>(
    null
  );
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const getLoggedinUserId = () => {
    console.log("hardcoded for now");
    return "moosa123";
  };

  const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  const BASE_URL =
    process.env.NODE_ENV === "production"
      ? `https://${process.env.NEXT_PUBLIC_PROD_URL}`
      : "http://localhost:3000";

  if (!STRIPE_PUBLIC_KEY) {
    throw new Error("STRIPE_PUBLIC_KEY is not set");
  }

  if (!BASE_URL) {
    throw new Error("BASE_URL is not set");
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: {
      package: "premium",
      name: "my name",
      description: "",
      submissionStartDate: new Date(),
      submissionEndDate: new Date(),
    },
  });

  const submissionStartDate = watch("submissionStartDate");
  const submissionEndDate = watch("submissionEndDate");

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormValues) => {
    console.log("[onSubmit] Starting form submission");
    setIsSubmitting(true);
    try {
      // In a real app, we would submit the form data to the server
      // and handle file uploads to S3

      const body = {
        ...data,
        creatorId: getLoggedinUserId(),
        // welcomeMessageBlob,
        // mediaType,
        // bannerImage,
      };
      console.log("[onSubmit] Form data to submit:", body);

      console.log("[onSubmit] Creating event...");
      const createdEvent = await fetch(`${BASE_URL}/api/event`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!createdEvent.ok) {
        console.error(
          "[onSubmit] Failed to create event:",
          await createdEvent.text()
        );
        throw new Error("Failed to create event");
      }
      console.log("[onSubmit] Event created successfully");

      // Create Stripe Checkout session
      console.log("[onSubmit] Creating Stripe checkout session...");
      const checkoutSession = await fetch(`${BASE_URL}/api/checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          package: data.package,
          eventId: (await createdEvent.json()).data.id,
        }),
      });

      if (!checkoutSession.ok) {
        console.error(
          "[onSubmit] Failed to create checkout session:",
          await checkoutSession.text()
        );
        throw new Error("Failed to create checkout session");
      }

      const { sessionId } = await checkoutSession.json();
      console.log("[onSubmit] Got session ID:", sessionId);

      if (!sessionId) {
        console.error("[onSubmit] No session ID returned");
        throw new Error("No session ID returned");
      }

      console.log("[onSubmit] Loading Stripe...");
      const stripe = await loadStripe(STRIPE_PUBLIC_KEY);
      if (!stripe) {
        console.error("[onSubmit] Failed to load Stripe");
        throw new Error("Failed to load Stripe");
      }
      console.log("[onSubmit] Redirecting to Stripe checkout...");
      stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error("[onSubmit] Error creating event:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., John & Sarah's Wedding"
                  {...register("name", { required: "Event name is required" })}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Tell your guests about this event"
                  className="resize-none"
                  rows={3}
                  {...register("description")}
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
                        setBannerPreview(null);
                        setBannerImage(null);
                      }}
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop an image, or click to browse
                    </p>
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerChange}
                    />
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
              Record a welcome message for your guests. This will be shown when
              they scan the QR code.
            </p>

            <MediaRecorder
              type="video"
              onRecordingComplete={setWelcomeMessageBlob}
              description="Record a welcome message for your guests"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">
              Message Submission Period
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set the time period during which guests can submit messages
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <DatePicker
                  date={submissionStartDate}
                  setDate={(date) =>
                    setValue("submissionStartDate", date, {
                      shouldValidate: true,
                    })
                  }
                  className="w-full"
                />
                {errors.submissionStartDate && (
                  <p className="text-red-500 text-xs mt-1">
                    Start date is required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <DatePicker
                  date={submissionEndDate}
                  setDate={(date) =>
                    setValue("submissionEndDate", date, {
                      shouldValidate: true,
                    })
                  }
                  className="w-full"
                />
                {errors.submissionEndDate && (
                  <p className="text-red-500 text-xs mt-1">
                    End date is required
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Choose a Package</h2>

            <RadioGroup defaultValue="premium" className="space-y-4">
              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic" className="flex-1 cursor-pointer">
                  <div className="font-medium">Basic</div>
                  <div className="text-sm text-muted-foreground">
                    Up to 50 messages, 30 days active
                  </div>
                </Label>
                <div className="font-semibold">$100</div>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="premium" id="premium" />
                <Label htmlFor="premium" className="flex-1 cursor-pointer">
                  <div className="font-medium">Premium</div>
                  <div className="text-sm text-muted-foreground">
                    Up to 200 messages, 90 days active
                  </div>
                </Label>
                <div className="font-semibold">$200</div>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4">
                <RadioGroupItem value="deluxe" id="deluxe" />
                <Label htmlFor="deluxe" className="flex-1 cursor-pointer">
                  <div className="font-medium">Deluxe</div>
                  <div className="text-sm text-muted-foreground">
                    Unlimited messages, 1 year active
                  </div>
                </Label>
                <div className="font-semibold">$500</div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Creating Event..." : "Continue to Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
