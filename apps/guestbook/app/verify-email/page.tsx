import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { VerifyEmailForm } from './verify-email-form';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to complete signup',
};

export default async function VerifyEmailPage() {
  const user = await currentUser();
  if (user) {
    redirect('/');
  }

  return <VerifyEmailForm />;
}
