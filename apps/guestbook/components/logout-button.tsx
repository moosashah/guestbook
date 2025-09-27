'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logout } from '@/app/actions';

export function LogoutButton() {
  const handleLogout = async () => {
    await logout();
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
