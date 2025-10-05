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
  const isProduction = process.env.NODE_ENV === 'production';

  console.log('=== Setting Authentication Tokens ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Is Production:', isProduction);
  console.log('Access token length:', access.length);
  console.log('Refresh token length:', refresh.length);

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 34560000, // 400 days
    secure: isProduction, // Only secure in production (HTTPS)
  };

  try {
    cookies.set({
      name: 'access_token',
      value: access,
      ...cookieOptions,
    });
    console.log('✅ Access token cookie set successfully');

    cookies.set({
      name: 'refresh_token',
      value: refresh,
      ...cookieOptions,
    });
    console.log('✅ Refresh token cookie set successfully');
  } catch (error) {
    console.error('❌ Failed to set cookies:');
    console.error('Error:', error);
    console.error('Cookie options:', JSON.stringify(cookieOptions, null, 4));
    throw error;
  }
}
