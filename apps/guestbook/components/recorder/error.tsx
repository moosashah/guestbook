'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertCircle, Camera, Mic, RefreshCw, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorProps {
  type: 'audio' | 'video';
  className?: string;
  error: {
    type: 'permission' | 'device' | 'unknown';
    message: string;
  };
  retryPermission: () => void;
  resetRecording: () => void;
}

export const Error = ({
  type,
  className,
  error,
  retryPermission,
  resetRecording,
}: ErrorProps) => {
  const getIcon = () => {
    if (error.type === 'permission') {
      return type === 'video' ? (
        <Camera className='h-12 w-12 mx-auto mb-2 text-red-500' />
      ) : (
        <Mic className='h-12 w-12 mx-auto mb-2 text-red-500' />
      );
    }
    return <AlertCircle className='h-12 w-12 mx-auto mb-2 text-red-500' />;
  };

  const getTitle = () => {
    switch (error.type) {
      case 'permission':
        return `${type === 'video' ? 'Camera & Microphone' : 'Microphone'} Access Required`;
      case 'device':
        return `${type === 'video' ? 'Camera/Microphone' : 'Microphone'} Issue`;
      default:
        return 'Recording Error';
    }
  };

  const getHelpText = () => {
    if (error.type === 'permission') {
      const permissionText =
        type === 'video' ? 'camera and microphone access' : 'microphone access';
      const iconText =
        type === 'video' ? 'camera/microphone icon' : 'microphone icon';

      return (
        <div className='text-sm text-muted-foreground space-y-3'>
          <div>
            <p className='font-medium mb-2'>To enable recording:</p>
            <ol className='list-decimal list-inside space-y-1 text-left'>
              <li>Look for the {iconText} in your browser's address bar</li>
              <li>Click it and select "Allow" for {permissionText}</li>
              <li>Click "Try Again" below</li>
            </ol>
          </div>

          <div className='border-t pt-2'>
            <p className='font-medium mb-1'>Alternative methods:</p>
            <ul className='list-disc list-inside space-y-1 text-left text-xs'>
              <li>Refresh the page and try recording again</li>
              <li>Check your browser's site settings/permissions</li>
              <li>
                Make sure no other apps are using your{' '}
                {type === 'video' ? 'camera/microphone' : 'microphone'}
              </li>
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn('border rounded-lg p-6 text-center', className)}>
      {getIcon()}

      <h3 className='text-lg font-semibold mb-2'>{getTitle()}</h3>

      <Alert className='mb-4 text-left'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>

      {getHelpText()}

      <div className='flex flex-col sm:flex-row gap-2 justify-center mt-4'>
        {error.type === 'permission' && (
          <Button
            type='button'
            onClick={retryPermission}
            className='flex items-center gap-2'
          >
            <RefreshCw className='h-4 w-4' />
            Try Again
          </Button>
        )}

        <Button
          type='button'
          variant='outline'
          onClick={resetRecording}
          className='flex items-center gap-2'
        >
          <Settings className='h-4 w-4' />
          Back to Start
        </Button>
      </div>

      {error.type === 'permission' && (
        <div className='text-xs text-muted-foreground mt-4 space-y-1'>
          <p>
            <strong>Note:</strong> The "Try Again" button will request
            permissions again, but some browsers may not show the popup if you
            previously denied access.
          </p>
          <p>
            If the popup doesn't appear, you'll need to manually enable
            permissions through your browser settings.
          </p>
        </div>
      )}
    </div>
  );
};
