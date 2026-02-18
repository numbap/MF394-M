/**
 * Google OAuth Authentication Hook
 *
 * Handles cross-platform Google Sign-In using expo-auth-session.
 *
 * Flow:
 * 1. Open Google sign-in via authorization code + PKCE
 * 2. Exchange code for tokens at Google's token endpoint
 * 3. Extract id_token from token response
 * 4. Send id_token to backend → receive app JWT
 *
 * On web, the web/desktop client ID is used.
 * On native (iOS/Android), the platform-specific client IDs are used.
 *
 * Google's implicit flow (response_type=id_token) is no longer supported
 * for web apps, so we always use the authorization code + PKCE flow.
 *
 * Note: The web OAuth client in Google Cloud Console is type "Web application",
 * which requires client_secret even when using PKCE. This is expected.
 */

import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import {
  GOOGLE_OAUTH_CLIENT_ID_iOS,
  GOOGLE_OAUTH_CLIENT_ID_Android,
  GOOGLE_OAUTH_WEB_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from '../utils/constants';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();

  const clientId = Platform.select({
    ios: GOOGLE_OAUTH_CLIENT_ID_iOS,
    android: GOOGLE_OAUTH_CLIENT_ID_Android,
    default: GOOGLE_OAUTH_WEB_CLIENT_ID,
  }) ?? GOOGLE_OAUTH_WEB_CLIENT_ID!;

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: Platform.OS !== 'web' ? 'com.ummyou.facememorizer' : undefined,
  });

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  const signInWithGoogle = useCallback(async () => {
    if (!request) {
      dispatch(loginFailure('OAuth not ready'));
      return;
    }

    try {
      dispatch(loginStart());

      const result = await promptAsync();
      if (result?.type !== 'success') {
        dispatch(loginFailure('Sign-in cancelled'));
        return;
      }

      const { code } = result.params;

      // Exchange authorization code for tokens using PKCE verifier + client secret.
      // The web client requires client_secret (Web application type in Google Cloud Console).
      const tokenResponse = await AuthSession.exchangeCodeAsync(
        {
          clientId,
          clientSecret: GOOGLE_CLIENT_SECRET,
          redirectUri,
          code,
          extraParams: {
            code_verifier: request.codeVerifier!,
          },
        },
        discovery
      );

      const idToken = tokenResponse.idToken;
      if (!idToken) {
        dispatch(loginFailure('No ID token received from Google'));
        return;
      }

      // Exchange Google ID token for app JWT
      const loginResult = await login({ idToken }).unwrap();

      await tokenStorage.setToken(loginResult.token);

      const userId = (loginResult.user as any)._id || (loginResult.user as any).id;

      dispatch(loginSuccess({
        user: {
          id: userId,
          email: loginResult.user.email,
          name: loginResult.user.name,
          image: loginResult.user.image,
          provider: 'google',
        },
        token: loginResult.token,
      }));
    } catch (error: any) {
      const message = error?.data?.error || error?.error || error?.message || 'Authentication failed';
      console.error('Google Sign-In Error:', message, error);
      dispatch(loginFailure(message));
      throw error;
    }
  }, [dispatch, login, promptAsync, request, clientId, redirectUri]);

  return {
    signInWithGoogle,
    request,
  };
}
