import { Logo, LogoText } from '@/components/svgs/logo';
import { Chapel } from '@/components/svgs/chapel';
import { Flower } from '@/components/svgs/flower';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageUrl?: string;
}

export function AuthLayout({
  children,
  imageUrl = '/signin.jpg',
}: AuthLayoutProps) {
  return (
    <div className='flex flex-col bg-[#FFFAF8] lg:flex-row relative overflow-hidden min-h-screen'>
      {/* Decorative Flower - Top Right */}
      <div className='absolute top-[35%] -right-50 sm:right-10 lg:top-0 lg:right-0 z-0 opacity-15 lg:opacity-30'>
        <Flower size={600} className='text-[#B3496B]' />
      </div>

      {/* Decorative Chapel - Bottom Left */}
      <div className='absolute bottom-0 right-[30%] lg:bottom-0 lg:right-0 z-0 lg:opacity-15 opacity-5'>
        <div className='w-60 h-auto lg:w-[600px]'>
          <Chapel size={600} className='text-[#B3496B] w-full h-auto' />
        </div>
      </div>

      {/* Mobile top image */}
      <div className='lg:hidden relative h-80 z-10'>
        <div
          className='absolute inset-0 bg-cover bg-position-[center_65%] sm:bg-position-[center_55%] bg-no-repeat'
          style={{ backgroundImage: `url(${imageUrl})` }}
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
          style={{ backgroundImage: `url(${imageUrl})` }}
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

      {/* Form content */}
      <div className='flex-1 flex items-center justify-center p-8 relative z-10'>
        <div className='w-full max-w-md'>{children}</div>
      </div>
    </div>
  );
}
