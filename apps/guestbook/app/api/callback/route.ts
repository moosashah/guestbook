import { client, setTokens } from '../../auth';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Log the incoming callback request
  console.log('=== OAuth Callback ===');
  console.log('URL:', req.url);
  console.log('Code present:', !!code);
  console.log('Error present:', !!error);

  if (error) {
    console.error('OAuth Error from provider:');
    console.error('Error:', error);
    console.error('Description:', errorDescription);
    console.error(
      'Full URL params:',
      JSON.stringify(Object.fromEntries(url.searchParams.entries()), null, 4)
    );
    return NextResponse.json(
      {
        error: 'OAuth authentication failed',
        details: { error, errorDescription },
      },
      { status: 400 }
    );
  }

  if (!code) {
    console.error('No authorization code received in callback');
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    );
  }

  try {
    const exchanged = await client.exchange(code, `${url.origin}/api/callback`);

    if (exchanged.err) {
      console.error('Token exchange failed:');
      console.error('Error details:', JSON.stringify(exchanged.err, null, 4));
      return NextResponse.json(exchanged.err, { status: 400 });
    }

    console.log('Token exchange successful');
    console.log(
      'Access token received:',
      exchanged.tokens.access ? 'YES' : 'NO'
    );
    console.log(
      'Refresh token received:',
      exchanged.tokens.refresh ? 'YES' : 'NO'
    );

    try {
      await setTokens(exchanged.tokens.access, exchanged.tokens.refresh);
      console.log('✅ Tokens set successfully, redirecting to home');
    } catch (tokenError) {
      console.error('❌ Failed to set tokens:');
      console.error('Token error:', tokenError);
      return NextResponse.json(
        { error: 'Failed to set authentication tokens' },
        { status: 500 }
      );
    }

    return NextResponse.redirect(`${url.origin}/`);
  } catch (error) {
    console.error('Unexpected error in callback handler:');
    console.error('Error:', error);
    console.error(
      'Stack:',
      error instanceof Error ? error.stack : 'No stack available'
    );

    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
