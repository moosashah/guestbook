import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo, LogoText } from '@/components/svgs/logo';
import { auth } from '../actions';
import { redirect } from 'next/navigation';
import {
  FacebookLoginButton,
  GoogleLoginButton,
} from '@/components/login-buttons';

export default async function LoginPage() {
  // Check if user is already authenticated
  const user = await auth();
  if (user) {
    redirect('/');
  }
  return (
    <div className='flex flex-col lg:flex-row relative overflow-hidden h-screen'>
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
      <div className='flex-1 flex items-center justify-center p-8 bg-cream'>
        <div className='w-full max-w-md'>
          <Card className='border-0 shadow-lg'>
            <CardHeader className='space-y-1 text-center'>
              <CardTitle className='text-2xl font-semibold'>Sign In</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <GoogleLoginButton />
              <FacebookLoginButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
