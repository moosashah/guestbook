'use client';

import { Check, Mic, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaRecorder } from '@/components/media-recorder';
import { UploadProgressComponent } from '@/components/upload-progress';
import { useState } from 'react';
import type { Event } from '@/lib/types';
import { uploadMessage, UploadProgress } from '@/lib/upload-client';
import { WelcomeMessagePlayer } from './welcome-message-player';
import { PACKAGE_LIMITS } from '@/lib/consts';

export function GuestForm({ event }: { event: Event }) {
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [messageBlob, setMessageBlob] = useState<Blob | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [uploadError, setUploadError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageBlob) {
      setUploadError('Please record a message first');
      setUploadStatus('error');
      return;
    }

    setIsSubmitting(true);
    setUploadStatus('uploading');
    setUploadProgress(null);
    setUploadError('');

    try {
      await uploadMessage(
        {
          event_id: event.id,
          guest_name: guestName,
          media_type: mediaType,
          message_blob: messageBlob,
        },
        {
          onProgress: progress => {
            setUploadProgress(progress);
          },
          onSuccess: response => {
            console.log('Upload successful:', response);
            setUploadStatus('success');
            setIsSuccess(true);
            setIsSubmitting(false);
          },
          onError: error => {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setUploadError(error.message);
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('Error submitting message:', error);
      setUploadStatus('error');
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setIsSubmitting(false);
    }
  };

  const handleRetryUpload = () => {
    handleSubmit(new Event('submit') as any);
  };

  const handleCancelUpload = () => {
    setUploadStatus('idle');
    setUploadProgress(null);
    setUploadError('');
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className='  flex items-center justify-center bg-muted/20 p-4'>
        <Card className='w-full max-w-md text-center'>
          <CardContent className='pt-12 pb-8 px-6'>
            <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6'>
              <Check className='h-8 w-8' />
            </div>

            <h1 className='text-2xl font-bold mb-4'>Thank You!</h1>
            <p className='text-muted-foreground mb-6'>
              Your message has been submitted successfully. The happy couple
              will be delighted to receive it!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className='  flex items-center justify-center bg-muted/20 p-4'>
      <Card className='w-full max-w-md'>
        <CardContent className='pt-6 pb-8 px-6'>
          <div className='text-center mb-6'>
            <Link href={`/events/${event.id}`}>
              <h1 className='text-2xl font-bold mb-2'>{event.name}</h1>
            </Link>
            <p className='text-muted-foreground'>
              Leave a message for the happy couple
            </p>
            <div className='mt-2 text-sm text-muted-foreground'>
              Messages: {event.message_count}/{PACKAGE_LIMITS[event.package]}
            </div>
          </div>

          {event.welcome_message && <WelcomeMessagePlayer eventId={event.id} />}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Your Name</Label>
              <Input
                id='name'
                placeholder='Enter your name'
                required
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label>Record Your Message</Label>
              <Tabs
                defaultValue='video'
                onValueChange={value =>
                  setMediaType(value as 'video' | 'audio')
                }
              >
                <TabsList className='mb-4 border'>
                  <TabsTrigger value='video'>
                    <Video className='mr-2 h-4 w-4' />
                    Video
                  </TabsTrigger>
                  <TabsTrigger value='audio'>
                    <Mic className='mr-2 h-4 w-4' />
                    Audio
                  </TabsTrigger>
                </TabsList>

                <TabsContent value='video'>
                  <MediaRecorder
                    type='video'
                    setBlob={setMessageBlob}
                    description='Record a video message for the happy couple'
                  />
                </TabsContent>

                <TabsContent value='audio'>
                  <MediaRecorder
                    type='audio'
                    setBlob={setMessageBlob}
                    description='Record an audio message for the happy couple'
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Upload Progress */}
            {uploadStatus !== 'idle' && (
              <UploadProgressComponent
                progress={uploadProgress}
                status={uploadStatus}
                error={uploadError}
                onRetry={handleRetryUpload}
                onCancel={handleCancelUpload}
              />
            )}

            <Button
              type='submit'
              className='w-full'
              disabled={isSubmitting || !messageBlob || !guestName}
            >
              {isSubmitting ? 'Uploading...' : 'Submit Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
