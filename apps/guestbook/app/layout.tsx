import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Type for the authenticated user subject
interface AuthenticatedUser {
  properties: {
    email: string;
    name: string;
    picture: string;
  };
}

const inter = Inter({ subsets: ['latin'] });

import type { Viewport } from 'next';
import { auth } from './actions';
import { Button } from '@/components/ui/button';
import { headers } from 'next/headers';
import { Logo, LogoText } from '@/components/svgs/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from '@/components/logout-button';

export const viewport: Viewport = {
  themeColor: 'white',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Wedwi',
  description: 'Collect and cherish wedding memories from your guests',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const subject = await auth();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Check if current path should hide header
  const shouldHideHeader =
    pathname.startsWith('/guest') || pathname.startsWith('/login');

  return (
    <html lang='en'>
      <body className={cn(inter.className, 'bg-cream')}>
        {/* Header */}
        {subject && !shouldHideHeader ? <Header subject={subject} /> : null}
        {children}
        <Toaster />
        {/* Clean up Facebook OAuth URL fragment */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Clean up Facebook OAuth URL fragment (#_=_)
              if (window.location.hash === '#_=_') {
                // Remove the fragment without causing a page reload
                history.replaceState(null, null, window.location.pathname + window.location.search);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

function Header({ subject }: { subject: AuthenticatedUser }) {
  return (
    <header className='sticky top-0 z-50 w-full shadow-xs bg-cream container mx-auto'>
      {/* Main Header */}
      <div className='flex items-center justify-between px-4 py-3'>
        {/* Logo and Brand */}
        <div className='flex items-center gap-3'>
          <Logo size={32} />
          <LogoText color='#2B1105' />
        </div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='relative h-10 w-10 rounded-full p-0 hover:bg-gray-50'
            >
              <Avatar className='h-10 w-10 ring-2 ring-white shadow-sm'>
                <AvatarImage
                  src={subject.properties.picture}
                  alt={subject.properties.name}
                />
                <AvatarFallback className='bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold text-sm'>
                  {subject.properties.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-64' align='end' forceMount>
            <div className='flex items-center justify-start gap-3 p-3 border-b'>
              <Avatar className='h-12 w-12'>
                <AvatarImage
                  src={subject.properties.picture}
                  alt={subject.properties.name}
                />
                <AvatarFallback className='bg-gradient-to-br from-pink-500 to-purple-600 text-white font-semibold'>
                  {subject.properties.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className='flex flex-col space-y-1 leading-none'>
                <p className='font-semibold text-sm text-gray-900'>
                  {subject.properties.name}
                </p>
                <p className='w-[180px] truncate text-xs text-gray-500'>
                  {subject.properties.email}
                </p>
              </div>
            </div>
            <LogoutButton />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
