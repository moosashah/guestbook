import { currentUser } from '@clerk/nextjs/server';
import { EventEntity } from './models';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Authenticates a user using Clerk
 * @returns Promise<AuthenticatedUser | null> - User object if authenticated, null otherwise
 */
export async function authenticate(): Promise<AuthenticatedUser | null> {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || '',
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
    picture: user.imageUrl,
  };
}

/**
 * Checks if a user is authorized to access a specific event
 * @param user - Authenticated user object
 * @param eventId - Event ID to check authorization for
 * @returns Promise<boolean> - True if authorized, false otherwise
 */
export async function isAuthorizedForEvent(
  user: AuthenticatedUser,
  eventId: string
): Promise<boolean> {
  try {
    const event = await EventEntity.get({ id: eventId }).go();

    if (!event.data || event.data.deleted_at !== 0) {
      return false;
    }

    // User is authorized if they are the creator of the event
    return event.data.creator_id === user.id;
  } catch (error) {
    console.error('Authorization error:', error);
    return false;
  }
}

/**
 * Combined authentication and authorization check for events
 * @param eventId - Event ID to check authorization for
 * @returns Promise<{ user: AuthenticatedUser | null, authorized: boolean }>
 */
export async function authenticateAndAuthorizeForEvent(eventId: string) {
  const user = await authenticate();

  if (!user) {
    return { user: null, authorized: false };
  }

  const authorized = await isAuthorizedForEvent(user, eventId);

  return { user, authorized };
}
