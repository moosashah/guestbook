import { LogoText, Logo } from '@/components/svgs/logo';
import { Card } from '@/components/ui/card';

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='container mx-auto py-8 px-4'>
      <header className='flex items-center justify-center gap-3'>
        <Logo size={32} />
        <LogoText color='#2B1105' />
      </header>
      <div className='mt-4 w-full max-w-md mx-auto flex items-center justify-center'>
        {children}
      </div>
    </div>
  );
}
