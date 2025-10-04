import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo, LogoText } from '@/components/svgs/logo';
import { Shield, Info } from 'lucide-react';

export default function DataDeletionPage() {
  return (
    <div className='min-h-screen bg-cream flex flex-col items-center justify-center p-4'>
      <div className='w-full max-w-2xl'>
        {/* Header with Logo */}
        <div className='flex items-center justify-center gap-3 mb-8'>
          <Logo size={48} />
          <LogoText color='#2B1105' />
        </div>

        {/* Main Card */}
        <Card className='shadow-lg border-[#f0f0f0] border'>
          <CardHeader className='text-center pb-6'>
            <div className='flex items-center justify-center gap-2 mb-4'>
              <Shield className='size-8 text-primary' />
              <CardTitle className='text-2xl font-semibold text-gray-800'>
                Data Deletion Instructions
              </CardTitle>
            </div>
            <p className='text-muted-foreground text-lg'>
              Facebook App Data Deletion Information
            </p>
          </CardHeader>

          <CardContent className='space-y-6'>
            {/* Info Section */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <Info className='size-5 text-blue-600 mt-0.5 flex-shrink-0' />
                <div>
                  <h3 className='font-semibold text-blue-900 mb-2'>
                    No Data Storage Policy
                  </h3>
                  <p className='text-blue-800 text-sm leading-relaxed'>
                    Wedwi does not store, collect, or retain any personal data
                    from Facebook users. When you interact with our application
                    through Facebook, we only access the minimum required
                    information for authentication purposes during your active
                    session.
                  </p>
                </div>
              </div>
            </div>

            {/* What This Means Section */}
            <div className='space-y-4'>
              <h3 className='font-semibold text-gray-800 text-lg'>
                What this means for you:
              </h3>
              <ul className='space-y-3 text-gray-700'>
                <li className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
                  <span>
                    <strong>No data to delete:</strong> Since we don&apos;t
                    store your Facebook data, there is no personal information
                    to remove from our systems.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
                  <span>
                    <strong>Session-only access:</strong> Any information
                    accessed during login is only used temporarily and is not
                    saved to our databases.
                  </span>
                </li>
                <li className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0'></div>
                  <span>
                    <strong>Automatic cleanup:</strong> When you log out or your
                    session expires, any temporary data is automatically
                    cleared.
                  </span>
                </li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h3 className='font-semibold text-gray-800 mb-2'>
                Questions or Concerns?
              </h3>
              <p className='text-gray-600 text-sm'>
                If you have any questions about our data practices or need
                assistance, please feel free to contact our support team.
                We&apos;re committed to transparency and protecting your
                privacy.
              </p>
            </div>

            {/* Footer */}
            <div className='text-center pt-4 border-t border-gray-200'>
              <p className='text-sm text-muted-foreground'>
                This page serves as our data deletion instructions URL for
                Facebook App compliance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to App Link */}
        <div className='text-center mt-6'>
          <a
            href='/'
            className='text-primary hover:text-primary/80 font-medium transition-colors'
          >
            ← Back to Wedwi
          </a>
        </div>
      </div>
    </div>
  );
}
