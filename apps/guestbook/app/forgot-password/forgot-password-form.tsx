'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setEmailSent(true);
      // Store email in session storage for reset password page
      sessionStorage.setItem('resetPasswordEmail', email);
      router.push('/reset-password');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.errors?.[0]?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded || !email) return;

    setIsLoading(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setEmailSent(true);
    } catch (err: any) {
      console.error('Resend error:', err);
      setError(err.errors?.[0]?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl lg:text-4xl font-semibold'>Forgot Password</h2>
          <p className='text-sm text-gray-600 mt-2'>
            Enter your email address and we&apos;ll send you a verification code
            to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {emailSent && (
            <div className='bg-green-50 text-green-600 p-3 rounded-lg text-sm'>
              Verification code sent! Check your email.
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>Email Address</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter your email'
              required
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='text-sm'>
              {emailSent && (
                <button
                  type='button'
                  onClick={handleResend}
                  disabled={isLoading}
                  className='text-primary hover:underline'
                >
                  Have not got link? Resend
                </button>
              )}
            </div>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        </form>

        <div className='text-sm text-gray-600'>
          Already have an account?{' '}
          <Link href='/login' className='text-primary hover:underline'>
            Login account
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
