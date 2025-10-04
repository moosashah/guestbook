import { NextRequest, NextResponse } from 'next/server';
import { cookies as getCookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    console.log('=== Logout API Route ===');
    console.log('Request URL:', req.url);

    // Clear authentication cookies
    const cookies = await getCookies();
    cookies.delete('access_token');
    cookies.delete('refresh_token');

    console.log('Cookies cleared successfully');

    // Get the origin from the request to redirect properly
    const url = new URL(req.url);
    const redirectUrl = `${url.origin}/login`;

    console.log('Redirecting to:', redirectUrl);

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in logout route:');
    console.error('Error:', error);
    console.error(
      'Stack:',
      error instanceof Error ? error.stack : 'No stack available'
    );

    // Even if there's an error, try to redirect to login
    const url = new URL(req.url);
    return NextResponse.redirect(`${url.origin}/login`);
  }
}
