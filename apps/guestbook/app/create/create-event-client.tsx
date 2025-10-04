'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaRecorder } from '@/components/media-recorder';
import { useForm, Controller } from 'react-hook-form';
import { DateRange } from 'react-day-picker';
import type { AuthenticatedUser } from '@/lib/auth.server';
import RangePickerCalendar from '@/components/range-picker-calendar';

interface FormValues {
  name: string;
  description?: string;
  dateRange: DateRange;
}

interface CreateEventClientProps {
  user: AuthenticatedUser;
}

export default function CreateEventClient({ user }: CreateEventClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeMessageBlob, setWelcomeMessageBlob] = useState<Blob | null>(
    null
  );
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      dateRange: {
        from: new Date(),
        to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    },
  });

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setBannerImage(file);
      const reader = new FileReader();
      reader.onload = e => {
        setBannerPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Create the event first
      const eventFormData = new FormData();
      eventFormData.append('name', data.name);
      if (data.description) {
        eventFormData.append('description', data.description);
      }
      eventFormData.append(
        'submission_start_date',
        data.dateRange.from!.toISOString()
      );
      eventFormData.append(
        'submission_end_date',
        data.dateRange.to!.toISOString()
      );
      eventFormData.append('package', 'basic'); // Default package, user can change on payment page
      eventFormData.append('creator_id', user.id);
      eventFormData.append('payment_status', 'pending');

      if (bannerImage) {
        eventFormData.append('banner_image', bannerImage);
      }

      if (welcomeMessageBlob) {
        eventFormData.append(
          'welcome_message',
          welcomeMessageBlob,
          'welcome-message.webm'
        );
      }

      console.log('Creating event...');
      const eventResponse = await fetch('/api/event', {
        method: 'POST',
        body: eventFormData,
      });

      if (!eventResponse.ok) {
        const errorData = await eventResponse.json();
        throw new Error(
          `Failed to create event: ${errorData.error || 'Unknown error'}`
        );
      }

      const createdEvent = await eventResponse.json();
      console.log('Event created:', JSON.stringify(createdEvent, null, 4));

      // Redirect to payment page
      window.location.href = `/events/${createdEvent.data.id}/payment`;
    } catch (error) {
      console.error('Error creating event:', error);
      alert(
        `Failed to create event. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 max-w-2xl'>
      <div className='mb-6'>
        <Link
          href='/'
          className='inline-flex items-center text-sm text-primary/60 hover:text-primary mb-4'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
        <h1 className='text-3xl font-bold'>Create New Event</h1>
        <p className='text-muted-foreground mt-2'>
          Set up your event to start collecting video messages from guests
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Event Details</h2>

            <div className='space-y-4'>
              <div>
                <Label htmlFor='name'>Event Name *</Label>
                <Controller
                  name='name'
                  control={control}
                  rules={{ required: 'Event name is required' }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., Sarah & John's Wedding"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.name && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='description'>Welcome Message</Label>
                <Controller
                  name='description'
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder='Tell your guests about the event...'
                      rows={3}
                    />
                  )}
                />
              </div>

              <div>
                <Label htmlFor='dateRange'>Message Collection Period *</Label>
                <Controller
                  name='dateRange'
                  control={control}
                  rules={{ required: 'Date range is required' }}
                  render={({ field }) => (
                    <RangePickerCalendar
                      placeholder='Select message collection period'
                      range={field.value}
                      setRange={field.onChange}
                    />
                  )}
                />
                {errors.dateRange && (
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.dateRange.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='banner'>Event Banner</Label>
                <div className='mt-2'>
                  <Input
                    type='file'
                    accept='image/*'
                    onChange={handleBannerUpload}
                    className='hidden'
                    id='banner-upload'
                  />
                  <Label
                    htmlFor='banner-upload'
                    className='cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors'
                  >
                    <Upload className='h-4 w-4' />
                    Choose Banner Image
                  </Label>
                  {bannerPreview && (
                    <div className='mt-4'>
                      <img
                        src={bannerPreview}
                        alt='Banner preview'
                        className='w-full h-32 object-cover rounded-lg'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>Audio Message</h2>
            <p className='text-muted-foreground mb-4'>
              Record an audio message for your guests (optional)
            </p>
            <MediaRecorder
              type='audio'
              setBlob={setWelcomeMessageBlob}
              description='Record an audio message for your guests'
            />
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button
            type='submit'
            disabled={isSubmitting}
            size='lg'
            className='min-w-[200px]'
          >
            {isSubmitting ? 'Creating...' : 'Continue to Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
