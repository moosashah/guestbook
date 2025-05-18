"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Download, Edit, Share2 } from "lucide-react";

export function EventButtons({ eventId }: { eventId: string }) {
  const handleDownloadQR = () => {
    toast.info("QR code download functionality needs to be implemented.");
  };

  const handleShare = () => {
    toast.info("Sharing functionality needs to be implemented.");
  };
  return (
    <div className="flex gap-2">
      <Link href={`/events/${eventId}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Event
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={handleDownloadQR}>
        <Download className="mr-2 h-4 w-4" />
        Download QR
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </Button>
    </div>
  );
}
