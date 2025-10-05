import { auth } from '../actions';
import { redirect } from 'next/navigation';
import CreateEventClient from './create-event-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Event',
  description: 'Collect and cherish wedding memories from your guests',
};

export default async function CreateEventPage() {
  const subject = await auth();

  if (!subject) {
    redirect('/login');
  }

  return <CreateEventClient user={subject.properties} />;
}
