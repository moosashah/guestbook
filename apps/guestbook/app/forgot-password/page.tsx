import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { ForgotPasswordForm } from './forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Wedwi account password',
};

export default async function ForgotPasswordPage() {
  const user = await currentUser();
  if (user) {
    redirect('/');
  }

  return <ForgotPasswordForm />;
}
