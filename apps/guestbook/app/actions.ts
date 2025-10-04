'use server';

import { redirect } from 'next/navigation';
import { headers as getHeaders, cookies as getCookies } from 'next/headers';
import { client, setTokens } from './auth';
import { object, string } from 'valibot';

export async function auth() {
  const cookies = await getCookies();
  const accessToken = cookies.get('access_token');
  const refreshToken = cookies.get('refresh_token');

  if (!accessToken) {
    return false;
  }

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
    return false;
  }
  if (verified.tokens) {
    await setTokens(verified.tokens.access, verified.tokens.refresh);
  }

  return verified.subject;
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
