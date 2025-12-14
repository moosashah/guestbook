'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useClerk } from '@clerk/nextjs';

export function LogoutButton() {
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: '/login' });
  };

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      className='text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer'
    >
      Log out
    </DropdownMenuItem>
  );
}
