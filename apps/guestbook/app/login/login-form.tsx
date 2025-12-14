'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/password-input';

export function LoginForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLoaded) return;

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/');
      } else {
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (strategy: 'oauth_google' | 'oauth_facebook') => {
    signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  };

  return (
    <AuthLayout>
      <div className='space-y-6'>
        <div>
          <h2 className='text-2xl lg:text-4xl font-semibold'>Sign In</h2>
          <p className='text-sm text-gray-600 mt-2'>
            New user?{' '}
            <Link href='/signup' className='text-primary hover:underline'>
              Create an account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {error && (
            <div className='bg-red-50 text-red-600 p-3 rounded-lg text-sm'>
              {error}
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

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <PasswordInput
              id='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter your password'
              required
            />
          </div>

          <div className='flex items-center justify-between'>
            <Link
              href='/forgot-password'
              className='text-sm text-primary hover:underline'
            >
              Forget Password?
            </Link>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-[#FFFAF8] px-2 text-gray-500'>or</span>
          </div>
        </div>

        <div className='space-y-3'>
          <Button
            type='button'
            variant='outline'
            className='w-full h-[43px] bg-white border border-[#E0E0E0] text-black hover:bg-gray-50'
            onClick={() => handleOAuthSignIn('oauth_google')}
          >
            <svg className='size-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Sign in with Google
          </Button>

          <Button
            type='button'
            variant='outline'
            className='w-full h-[43px] bg-white border border-[#E0E0E0] text-black hover:bg-gray-50'
            onClick={() => handleOAuthSignIn('oauth_facebook')}
          >
            <svg
              className='size-5 mr-2'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 36 36'
              fill='url(#facebook-login)'
            >
              <defs>
                <linearGradient
                  x1='50%'
                  x2='50%'
                  y1='97.078%'
                  y2='0%'
                  id='facebook-login'
                >
                  <stop offset='0%' stopColor='#0062E0' />
                  <stop offset='100%' stopColor='#19AFFF' />
                </linearGradient>
              </defs>
              <path d='M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1-.8h-4l-1 .8z' />
              <path
                fill='#FFF'
                d='m25 23 .8-5H21v-3.5c0-1.4.5-2.5 2.7-2.5H26V7.4c-1.3-.2-2.7-.4-4-.4-4.1 0-7 2.5-7 7v4h-4.5v5H15v12.7c1 .2 2 .3 3 .3s2-.1 3-.3V23h4z'
              />
            </svg>
            Sign in with Facebook
          </Button>
        </div>

        <p className='text-xs text-gray-500 text-center'>
          Protected by reCAPTCHA and subject to the Google{' '}
          <a
            href='https://policies.google.com/privacy'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href='https://policies.google.com/terms'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:underline'
          >
            Terms of Service
          </a>
          .
        </p>

        <div id='clerk-captcha' />
      </div>
    </AuthLayout>
  );
}
