import { Logo, LogoText } from '@/components/svgs/logo';
import { Chapel } from '@/components/svgs/chapel';
import { Flower } from '@/components/svgs/flower';
import { auth } from '../actions';
import { redirect } from 'next/navigation';
import {
  FacebookLoginButton,
  GoogleLoginButton,
} from '@/components/login-buttons';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Collect and cherish wedding memories from your guests',
};

export default async function LoginPage() {
  // Check if user is already authenticated
  const user = await auth();
  if (user) {
    redirect('/');
  }
  return (
    <div className='flex flex-col bg-[#FFFAF8] lg:flex-row relative overflow-hidden h-screen'>
      {/* Decorative Flower - Top Right */}
      <div className='absolute top-[35%] right-0 lg:top-0 lg:right-0 z-0 opacity-30'>
        <Flower size={600} className='text-[#B3496B]' />
      </div>

      {/* Decorative Chapel - Bottom Left */}
      <div className='absolute bottom-0 right-0 lg:bottom-0 lg:right-0 z-0 opacity-15'>
        <Chapel size={600} className='text-[#B3496B]' />
      </div>

      {/* Mobile top image */}
      <div className='lg:hidden relative h-80 z-10'>
        <div
          className='absolute inset-0 bg-cover bg-position-[center_65%] sm:bg-position-[center_55%] bg-no-repeat'
          style={{ backgroundImage: 'url(/signin.jpg)' }}
        />
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative z-10 flex flex-col justify-end p-6 text-white'>
          <div className='flex items-center gap-3'>
            <Logo id='mobile-logo' size={32} />
            <LogoText color='white' />
          </div>
        </div>
      </div>

      {/* Desktop left side - Background image with overlay text */}
      <div className='hidden lg:flex lg:w-1/2 relative'>
        <div
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{ backgroundImage: 'url(/signin.jpg)' }}
        />
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative z-10 flex flex-col justify-end p-12 text-white'>
          <div className='space-y-4'>
            <div className='flex items-center gap-3'>
              <Logo id='desktop-logo' />
              <LogoText color='white' />
            </div>
            <h1 className='text-4xl font-bold leading-tight'>
              Welcome To Wedwi - Your Wedding Story
            </h1>
            <p className='text-lg text-white/90'>
              Step into your personal wedding archive. Watch, share, and cherish
              every moment captured on your special day — all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className='flex-1 flex items-center justify-center p-8 relative z-10'>
        <div className='w-full max-w-md space-y-6'>
          <h2 className='text-2xl lg:text-6xl font-semibold mb-8'>Sign In</h2>
          <GoogleLoginButton />
          <FacebookLoginButton />
        </div>
      </div>
    </div>
  );
}
