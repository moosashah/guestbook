"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function SuccessPage() {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    // In a real app, we would generate a unique link for the event
    const eventLink = "https://wedding-memories.app/guest/abc123";

    try {
      await navigator.clipboard.writeText(eventLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleDownloadQR = () => {
    toast.info("QR code download functionality needs to be implemented.");
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="text-center">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
            <Check className="h-10 w-10" />
          </div>

          <h1 className="text-3xl font-bold mb-4">
            Event Created Successfully!
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your event has been created and is ready to collect memories from
            your guests. Share the QR code with your guests to get started.
          </p>

          <div className="mb-8">
            <div className="bg-muted p-6 rounded-lg inline-block mb-4">
              <Image
                src="/qr-code.png"
                alt="Event QR Code"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleDownloadQR} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download QR
              </Button>
              <Button onClick={handleCopyLink} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                {isCopied ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/events/1`}>
              <Button>View Event Details</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
