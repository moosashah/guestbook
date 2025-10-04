import { Hono } from 'hono';
import { issuer } from '@openauthjs/openauth';
import { object, string, safeParse } from 'valibot';
import { GoogleProvider } from '@openauthjs/openauth/provider/google';
import { DynamoStorage } from '@openauthjs/openauth/storage/dynamo';
import { Jwt } from 'hono/utils/jwt';
import { FacebookProvider } from '@openauthjs/openauth/provider/facebook';
import {
  InvalidAccessTokenError,
  InvalidAuthorizationCodeError,
  InvalidRefreshTokenError,
  InvalidSubjectError,
  MissingParameterError,
  MissingProviderError,
  OauthError,
  UnauthorizedClientError,
  UnknownStateError,
} from '@openauthjs/openauth/error';

const userInfoSchema = object({
  email: string(),
  name: string(),
  picture: string(),
});

const authIssuer = issuer({
  subjects: {
    user: object({
      email: string(),
      name: string(),
      picture: string(),
    }),
  },
  //TODO: add shorter ttl for access token.. currently its set for a month and refresh token for a year
  // refreshing access token is broken so not setting it for now
  storage: DynamoStorage({
    table: 'guestbook-auth',
  }),
  // Remove after setting custom domain
  allow: async () => true,
  providers: {
    google: GoogleProvider({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      scopes: ['email', 'profile'],
    }),
    facebook: FacebookProvider({
      clientID: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      // Note: 'email' permission requires app review for production use
      scopes: ['email', 'public_profile'],
    }),
  },
  success: async (ctx, value) => {
    if (value.provider === 'google') {
      const result = safeParse(
        userInfoSchema,
        Jwt.decode(value.tokenset.raw.id_token).payload
      );

      if (!result.success) {
        throw new Error('Failed to decode user information');
      }

      return ctx.subject('user', {
        email: result.output.email,
        name: result.output.name,
        picture: result.output.picture,
      });
    }
    if (value.provider === 'facebook') {
      const accessToken = value.tokenset.access;
      try {
        // Fetch user profile from Facebook Graph API
        const response = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
        );

        if (!response.ok) {
          console.error(
            'Facebook API error:',
            response.status,
            response.statusText
          );
          const errorText = await response.text();
          console.error('Facebook API error response:', errorText);
          throw new Error(`Facebook API error: ${response.status}`);
        }

        const userProfile = await response.json();

        // Transform Facebook profile to match our schema
        const userInfo = {
          email: userProfile.email,
          name: userProfile.name,
          picture: userProfile.picture?.data?.url || '', // Facebook returns picture in nested format
        };

        const result = safeParse(userInfoSchema, userInfo);

        if (!result.success) {
          console.error(
            'Failed to validate Facebook user info:',
            result.issues
          );
          throw new Error('Failed to validate Facebook user information');
        }

        return ctx.subject('user', {
          email: result.output.email,
          name: result.output.name,
          picture: result.output.picture,
        });
      } catch (error) {
        console.error('Error fetching Facebook user profile:', error);
        throw new Error('Failed to fetch Facebook user profile');
      }
    }
    throw new Error('Invalid provider');
  },
  async error(error, req) {
    // Enhanced error logging with specific OpenAuth error types
    console.error('=== OpenAuth Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error object:', JSON.stringify(error, null, 4));
    console.error('Request URL:', req.url);
    console.error('Request method:', req.method);
    console.error(
      'Request headers:',
      JSON.stringify(Object.fromEntries(req.headers.entries()), null, 4)
    );

    // Handle specific OpenAuth error types
    if (error instanceof InvalidAccessTokenError) {
      console.error('🔑 Invalid access token provided');
    } else if (error instanceof InvalidAuthorizationCodeError) {
      console.error('🔐 Invalid authorization code - check OAuth flow');
    } else if (error instanceof InvalidRefreshTokenError) {
      console.error(
        '🔄 Invalid refresh token - user may need to re-authenticate'
      );
    } else if (error instanceof InvalidSubjectError) {
      console.error('👤 Invalid subject data - check success callback');
    } else if (error instanceof MissingParameterError) {
      console.error('❌ Missing required parameter in request');
    } else if (error instanceof MissingProviderError) {
      console.error('🚫 Provider not specified or not found');
    } else if (error instanceof OauthError) {
      console.error('🌐 OAuth provider returned an error');
    } else if (error instanceof UnauthorizedClientError) {
      console.error('🚨 Client not authorized for this redirect URI');
    } else if (error instanceof UnknownStateError) {
      console.error(
        '🔀 Unknown state - cookies may have expired or browser switched'
      );
    } else {
      console.error('❓ Unknown error type');
    }

    console.error('======================');

    // Also log stack trace if available
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }

    // Return a proper error response
    return new Response(
      JSON.stringify({
        error: 'Authentication failed',
        type: error.constructor.name,
        message: error.message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },
});

const app = new Hono();

// Mount the auth issuer on all routes
app.all('*', c => authIssuer.fetch(c.req.raw));

export default app;
