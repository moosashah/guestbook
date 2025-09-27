'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DeleteFinalVideoButtonProps {
  eventId: string;
  hasFinalVideo: boolean;
  onVideoDeleted: () => void;
}

export function DeleteFinalVideoButton({
  eventId,
  hasFinalVideo,
  onVideoDeleted,
}: DeleteFinalVideoButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/delete-final-video/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete final video');
      }

      toast.success('Final video deleted successfully');
      onVideoDeleted();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error((error as Error).message || 'Failed to delete final video');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasFinalVideo) {
    return null;
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm' disabled={isDeleting}>
          {isDeleting ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className='mr-2 h-4 w-4' />
              Delete Final Video
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Final Video</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the compiled final video? This
            action cannot be undone. You will need to recompile the video if you
            want to generate it again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            Delete Video
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
