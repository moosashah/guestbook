'use client';

import { Button } from '@/components/ui/button';
import { login } from '@/app/actions';

export const FacebookLoginButton = () => (
  <form action={() => login('facebook')}>
    <Button
      type='submit'
      className='w-full h-[43px] bg-white border border-[#E0E0E0] text-black hover:bg-primary transition-colors rounded-lg px-4 text-base font-normal gap-2'
      style={{ boxShadow: '0px 0px 2px 0px rgba(0, 0, 0, 0.1)' }}
      variant='outline'
    >
      <svg
        className='size-5'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 36 36'
        fill='url(#facebook-a)'
        height='20'
        width='20'
      >
        <defs>
          <linearGradient
            x1='50%'
            x2='50%'
            y1='97.078%'
            y2='0%'
            id='facebook-a'
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
  </form>
);

export const GoogleLoginButton = () => (
  <form action={() => login('google')}>
    <Button
      type='submit'
      className='w-full h-[43px] bg-white border border-[#E0E0E0] text-black hover:bg-primary transition-colors rounded-lg px-4 text-base font-normal gap-2'
      style={{ boxShadow: '0px 0px 2px 0px rgba(0, 0, 0, 0.1)' }}
      variant='outline'
    >
      <svg className='size-5' viewBox='0 0 24 24'>
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
  </form>
);
