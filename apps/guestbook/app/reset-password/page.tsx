import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set your new Wedwi account password',
};

export default async function ResetPasswordPage() {
  const user = await currentUser();
  if (user) {
    redirect('/');
  }

  return <ResetPasswordForm />;
}
