import { auth } from '@/app/actions';
import { redirect } from 'next/navigation';
import { EventEntity } from '@/lib/models';
import PaymentClient from './payment-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Event Creation',
  description: 'Collect and cherish wedding memories from your guests',
};

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const subject = await auth();

  if (!subject) {
    redirect('/login');
  }

  // Fetch the event to get package details
  try {
    const event = await EventEntity.get({ id: params.id }).go();

    if (!event.data) {
      redirect('/');
    }

    // Check if user is the creator of this event
    if (event.data.creator_id !== subject.id) {
      redirect('/');
    }

    //FUTURE: May need to remove this to allow users to get a higher package
    if (event.data.payment_status === 'success') {
      redirect(`/events/${params.id}`);
    }

    return <PaymentClient event={event.data} />;
  } catch (error) {
    console.error('Error fetching event:', error);
    redirect('/');
  }
}
