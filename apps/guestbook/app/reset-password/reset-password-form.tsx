'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';

export function ResetPasswordForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'password'>('code');

  useEffect(() => {
    // Check if user came from forgot password page
    const email = sessionStorage.getItem('resetPasswordEmail');
    if (!email) {
      router.push('/forgot-password');
    }
  }, [router]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        setStep('password');
      }
    } catch (err: any) {
      console.error('Verify code error:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.resetPassword({
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem('resetPasswordEmail');
        router.push('/');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.errors?.[0]?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl lg:text-4xl font-semibold'>
            {step === 'code' ? 'Verify Code' : 'Set New Password'}
          </h2>
          <p className='text-sm text-gray-600 mt-2'>
            {step === 'code'
              ? 'Enter the verification code sent to your email'
              : 'Create a strong password for your account'}
          </p>
        </div>

        {step === 'code' ? (
          <form onSubmit={handleVerifyCode} className='space-y-4'>
            {error && (
              <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm'>
                {error}
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
              <Link
                href='/forgot-password'
                className='text-sm text-primary hover:underline'
              >
                Back to forgot password
              </Link>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className='space-y-4'>
            {error && (
              <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm'>
                {error}
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='password'>New Password</Label>
              <PasswordInput
                id='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your new password'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm New Password</Label>
              <PasswordInput
                id='confirmPassword'
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
                required
              />
            </div>

            <div className='flex justify-end'>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Confirm Create'}
              </Button>
            </div>
          </form>
        )}

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
