'use server';

import { currentUser } from '@clerk/nextjs/server';

/**
 * Get the authenticated user from Clerk
 * Returns a user object compatible with the existing codebase structure
 */
export async function auth() {
  const user = await currentUser();

  if (!user) {
    return false;
  }

  return {
    id: user.id,
    properties: {
      email: user.primaryEmailAddress?.emailAddress || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      picture: user.imageUrl,
    },
  };
}
