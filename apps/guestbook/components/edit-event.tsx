'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { DateRangePicker } from '@/components/date-picker';
import { MediaRecorder } from '@/components/media-recorder';
import { Event } from '@/lib/types';
import { DateRange } from 'react-day-picker';

interface FormValues {
  name: string;
  description: string;
  dateRange: DateRange;
}

interface EditEventFormProps {
  event: NonNullable<Event>;
  bannerImageUrl?: string | null;
  welcomeMessageUrl?: string | null;
}

export function EditEventForm({
  event,
  bannerImageUrl,
  welcomeMessageUrl,
}: EditEventFormProps) {
  const router = useRouter();
  const [welcomeMessageBlob, setWelcomeMessageBlob] = useState<Blob | null>(
    null
  );
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    bannerImageUrl || null
  );

  const form = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: {
      name: event.name,
      description: event.description || '',
      dateRange: {
        from: new Date(event.submission_start_date),
        to: new Date(event.submission_end_date),
      },
    },
  });

  const validateDateRange = (dateRange: DateRange) => {
    if (!dateRange?.from || !dateRange?.to) {
      return 'Please select both start and end dates';
    }

    const now = new Date();
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Reset time for accurate comparison
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    //TODO: uncomment for prod
    // if (startDate <= now) {
    //   return "Start date must be in the future";
    // }

    if (endDate <= now) {
      return 'End date must be in the future';
    }

    if (endDate <= startDate) {
      return 'End date must be after start date';
    }

    return true;
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerImage(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add text fields
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append(
        'submission_start_date',
        data.dateRange.from!.toISOString()
      );
      formData.append('submission_end_date', data.dateRange.to!.toISOString());

      // Add banner image if selected
      if (bannerImage) {
        formData.append('banner_image', bannerImage);
      }

      // Add welcome message blob if recorded
      if (welcomeMessageBlob) {
        formData.append('welcome_message', welcomeMessageBlob);
      }

      const response = await fetch(`/api/event/${event.id}`, {
        method: 'PATCH',
        body: formData, // Send FormData instead of JSON
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to update event';

        // Set server error on the form
        form.setError('root', {
          type: 'server',
          message: errorMessage,
        });
        return;
      }

      const updatedEvent = await response.json();
      console.log(JSON.stringify(updatedEvent, null, 4));

      // Redirect to the event details page
      router.push(`/events/${event.id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      form.setError('root', {
        type: 'server',
        message: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <Card>
          <CardContent className='pt-6'>
            <h2 className='text-xl font-semibold mb-4'>Event Details</h2>

            {form.formState.errors.root && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm'>
                {form.formState.errors.root.message}
              </div>
            )}

            <div className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                rules={{ required: 'Event name is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., John & Sarah's Wedding"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell your guests about this event'
                        className='resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='space-y-2'>
                <Label htmlFor='banner'>Banner Image</Label>
                {bannerPreview ? (
                  <div className='space-y-2'>
                    {bannerImageUrl && !bannerImage && (
                      <p className='text-sm text-muted-foreground'>
                        Current banner image:
                      </p>
                    )}
                    {bannerImage && (
                      <p className='text-sm text-muted-foreground'>
                        New banner image preview:
                      </p>
                    )}
                    <div className='relative aspect-video rounded-lg overflow-hidden mb-2'>
                      <img
                        src={bannerPreview}
                        alt='Banner preview'
                        className='w-full h-full object-cover'
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='absolute bottom-2 right-2 bg-white/80'
                        onClick={() => {
                          setBannerPreview(bannerImageUrl || null);
                          setBannerImage(null);
                        }}
                      >
                        {bannerImageUrl ? 'Reset to Current' : 'Remove Image'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className='text-sm text-muted-foreground mb-2'>
                      {!bannerImageUrl
                        ? 'No banner image currently set.'
                        : 'Upload a new banner image for your event.'}
                    </p>
                    <div className='border-2 border-dashed rounded-lg p-6 text-center'>
                      <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground mb-2'>
                        Drag and drop an image, or click to browse
                      </p>
                      <Input
                        id='banner'
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleBannerChange}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          document.getElementById('banner')?.click()
                        }
                      >
                        Choose File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <h2 className='text-xl font-semibold mb-4'>Welcome Message</h2>

            {welcomeMessageUrl && (
              <div className='mb-4'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Current welcome message:
                </p>
                <div className='relative aspect-video rounded-lg overflow-hidden bg-black'>
                  <video
                    src={welcomeMessageUrl}
                    controls
                    className='w-full h-full object-contain'
                    preload='metadata'
                  />
                </div>
              </div>
            )}

            <p className='text-sm text-muted-foreground mb-4'>
              {welcomeMessageUrl
                ? 'Record a new welcome message for your guests. This will replace the existing welcome message.'
                : 'Upload a welcome message for your guests.'}
            </p>

            <MediaRecorder
              type='video'
              setBlob={setWelcomeMessageBlob}
              description='Record a welcome message for your guests'
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <h2 className='text-xl font-semibold mb-4'>
              Message Submission Period
            </h2>
            <p className='text-sm text-muted-foreground mb-4'>
              Set the time period during which guests can submit messages
            </p>

            <FormField
              control={form.control}
              name='dateRange'
              rules={{
                validate: validateDateRange,
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Date Range</FormLabel>
                  <FormControl>
                    <DateRangePicker
                      dateRange={field.value}
                      setDateRange={field.onChange}
                      className='w-full'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className='flex justify-end gap-3'>
          <Link href={`/events/${event.id}`}>
            <Button variant='outline' type='button'>
              Cancel
            </Button>
          </Link>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating Event...' : 'Update Event'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
