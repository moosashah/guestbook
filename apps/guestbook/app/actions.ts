'use server';

import { redirect } from 'next/navigation';
import { headers as getHeaders, cookies as getCookies } from 'next/headers';
import { client, setTokens } from './auth';
import { object, string } from 'valibot';

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get('access_token');
  const refreshToken = cookies.get('refresh_token');

  console.log('=== Auth Function Debug ===');
  console.log('Access token present:', !!accessToken);
  console.log('Refresh token present:', !!refreshToken);
  console.log('Access token value length:', accessToken?.value?.length || 0);
  console.log(
    'All cookies:',
    cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  );

  if (!accessToken) {
    console.log('❌ No access token found, returning false');
    return false;
  }

  console.log('Attempting token verification...');
  console.log('AUTH_SERVICE_URL:', process.env.AUTH_SERVICE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);

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
      console.error('❌ Token verification failed:');
      console.error('Error details:', JSON.stringify(verified.err, null, 4));
      console.error('Error type:', JSON.stringify(verified, null, 4));
      return false;
    }

    console.log('✅ Token verification successful');
    if (verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh);
    }

    return verified.subject;
  } catch (error) {
    console.error('❌ Exception during token verification:');
    console.error(
      'Error type:',
      error instanceof Error ? error.constructor.name : 'Unknown'
    );
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    );
    console.error('Full error:', JSON.stringify(error, null, 4));
    return false;
  }
}

export async function login(provider: string) {
  const cookies = await getCookies();
  const accessToken = cookies.get('access_token');
  const refreshToken = cookies.get('refresh_token');

  if (accessToken) {
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
    if (!verified.err && verified.tokens) {
      await setTokens(verified.tokens.access, verified.tokens.refresh);
      redirect('/');
    }
  }

  const headers = await getHeaders();
  const host = headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const { url } = await client.authorize(
    `${protocol}://${host}/api/callback`,
    'code',
    {
      provider,
    }
  );
  redirect(url);
}

export async function logout() {
  const cookies = await getCookies();
  cookies.delete('access_token');
  cookies.delete('refresh_token');

  redirect('/login');
}
