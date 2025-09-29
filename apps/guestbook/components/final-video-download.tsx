'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

interface FinalVideoDownloadProps {
  eventId: string;
  hasFinalVideo: boolean;
}

export function FinalVideoDownload({
  eventId,
  hasFinalVideo,
}: FinalVideoDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!hasFinalVideo) {
      toast.error('No compiled video available yet');
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/final-video/${eventId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get download URL');
      }

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download started!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error((error as Error).message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!hasFinalVideo) {
    return null;
  }

  return (
    <Button onClick={handleDownload} disabled={isDownloading} variant='outline'>
      <Download className='size-4' />
      {isDownloading ? 'Preparing Download...' : 'Download Final Video'}
    </Button>
  );
}
