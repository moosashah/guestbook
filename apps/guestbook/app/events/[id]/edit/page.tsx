import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { EventEntity } from '@/lib/models';
import { EditEventForm } from '@/components/edit-event';
import { getBannerImageUrl, getWelcomeMessageUrl } from '@/lib/s3.server';
import { auth } from '../../../actions';
import { redirect } from 'next/navigation';
import { isAuthorizedForEvent } from '@/lib/auth.server';

interface EditEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

const loadEvent = async (id: string) => {
  const e = await EventEntity.get({ id }).go();
  if (e.data && e.data.deleted_at !== 0) {
    return { data: null };
  }
  return { data: e.data };
};

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;

  // Check authentication
  const subject = await auth();
  if (!subject) {
    redirect('/login');
  }

  // Check authorization
  const authorized = await isAuthorizedForEvent(subject.properties, id);
  if (!authorized) {
    return (
      <div className='container mx-auto py-8 px-4 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
        <p className='text-muted-foreground mb-4'>
          You don't have permission to edit this event.
        </p>
        <Link href='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Find the event by ID
  const { data: event } = await loadEvent(id);

  if (!event) {
    return (
      <div className='container mx-auto py-8 px-4 text-center'>
        <h1 className='text-2xl font-bold mb-4'>Event not found</h1>
        <Link href='/'>
          <Button>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch banner image URL server-side if banner exists
  let bannerImageUrl: string | null = null;
  if (event.banner_image) {
    try {
      bannerImageUrl = await getBannerImageUrl(event.banner_image, 3600); // 1 hour expiry
    } catch (error) {
      console.error('[EditEventPage] Failed to get banner image URL:', error);
    }
  }

  // Fetch welcome message URL server-side if welcome message exists
  let welcomeMessageUrl: string | null = null;
  if (event.welcome_message) {
    try {
      welcomeMessageUrl = await getWelcomeMessageUrl(
        event.welcome_message,
        3600
      ); // 1 hour expiry
    } catch (error) {
      console.error(
        '[EditEventPage] Failed to get welcome message URL:',
        error
      );
    }
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <EditEventForm
        event={event}
        bannerImageUrl={bannerImageUrl}
        welcomeMessageUrl={welcomeMessageUrl}
      />
    </div>
  );
}
