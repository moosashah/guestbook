import { createClient } from '@openauthjs/openauth/client';
import { cookies as getCookies } from 'next/headers';

const AUTH_SERVICE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3002'
    : process.env.AUTH_SERVICE_URL;

export const client = createClient({
  clientID: 'nextjs',
  issuer: AUTH_SERVICE_URL,
});

export async function setTokens(access: string, refresh: string) {
  const cookies = await getCookies();

  cookies.set({
    name: 'access_token',
    value: access,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 34560000,
  });
  cookies.set({
    name: 'refresh_token',
    value: refresh,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 34560000,
  });
}
