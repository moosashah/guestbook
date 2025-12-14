import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SignupForm } from './signup-form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Wedwi account',
};

export default async function SignupPage() {
  const user = await currentUser();
  if (user) {
    redirect('/');
  }

  return <SignupForm />;
}
