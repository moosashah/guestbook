'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function VerifyEmailForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        console.log('Verification result:', result);
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');
    setResendSuccess(false);

    try {
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });
      setResendSuccess(true);
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
          <h2 className='text-2xl lg:text-4xl font-semibold'>Verify Email</h2>
          <p className='text-sm text-gray-600 mt-2'>
            We&apos;ve sent a 6-digit verification code to your email address.
            Enter the code below to verify your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm'>
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className='bg-green-50 text-green-600 p-3 rounded-lg text-sm'>
              Verification code resent! Check your email.
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='code'>Verification Code</Label>
            <Input
              id='code'
              type='text'
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder='Enter 6-digit code'
              required
              maxLength={6}
            />
          </div>

          <div className='flex items-center justify-between'>
            <button
              type='button'
              onClick={handleResend}
              disabled={isLoading}
              className='text-sm text-primary hover:underline'
            >
              Didn&apos;t receive code? Resend
            </button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>

        <div className='text-sm text-gray-600'>
          <Link href='/signup' className='text-primary hover:underline'>
            Back to sign up
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
