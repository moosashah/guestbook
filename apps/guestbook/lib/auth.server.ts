import { NextRequest } from 'next/server';
import { client } from '@/app/auth';
import { object, string } from 'valibot';
import { EventEntity } from './models';

export interface AuthenticatedUser {
  email: string;
  name: string;
  picture: string;
}

/**
 * Authenticates a user from the request cookies
 * @param req - NextRequest object
 * @returns Promise<AuthenticatedUser | null> - User object if authenticated, null otherwise
 */
export async function authenticate(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const accessToken = req.cookies.get('access_token');
  const refreshToken = req.cookies.get('refresh_token');

  if (!accessToken) {
    return null;
  }

  try {
    const verified = await client.verify(
      {
        user: object({
          email: string(),
          name: string(),
          picture: string(),
        }),
      },
      accessToken.value,
      {
        refresh: refreshToken?.value,
      }
    );

    if (verified.err) {
      console.error('Token verification failed:');
      console.error('Error type:', verified.err.constructor?.name || 'Unknown');
      console.error('Error details:', JSON.stringify(verified.err, null, 4));
      return null;
    }

    return verified.subject.properties;
  } catch (error) {
    console.error('Authentication error:');
    console.error(
      'Error type:',
      error instanceof Error ? error.constructor.name : 'Unknown'
    );
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('Full error:', JSON.stringify(error, null, 4));
    console.error('Access token present:', !!accessToken?.value);
    console.error('Refresh token present:', !!refreshToken?.value);

    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }

    return null;
  }
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
    return event.data.creator_id === user.email;
  } catch (error) {
    console.error('Authorization error:', error);
    return false;
  }
}

/**
 * Combined authentication and authorization check for events
 * @param req - NextRequest object
 * @param eventId - Event ID to check authorization for
 * @returns Promise<{ user: AuthenticatedUser | null, authorized: boolean }>
 */
export async function authenticateAndAuthorizeForEvent(
  req: NextRequest,
  eventId: string
) {
  const user = await authenticate(req);

  if (!user) {
    return { user: null, authorized: false };
  }

  const authorized = await isAuthorizedForEvent(user, eventId);

  return { user, authorized };
}
