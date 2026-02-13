/**
 * Google OAuth Authentication Hook
 *
 * Handles cross-platform Google Sign-In using expo-auth-session
 * Works on iOS, Android, and Web
 */

import * as AuthSession from 'expo-auth-session';
import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';

// Request config for Google OAuth
const request = AuthSession.useAuthRequest(
  {
    clientId: process.env.GOOGLE_OAUTH_WEB_CLIENT_ID || '',
    scopes: ['openid', 'profile', 'email'],
    redirectUrl: AuthSession.getRedirectUrl(),
    usePKCE: true,
  },
  AuthSession.discovery || {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  },
);

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const promptAsync = request?.[1]?.promptAsync;

  const signInWithGoogle = useCallback(async () => {
    if (!promptAsync) {
      console.error('OAuth not available');
      dispatch(loginFailure('OAuth not available'));
      return;
    }

    try {
      dispatch(loginStart());

      const result = await promptAsync();
      if (result?.type !== 'success') {
        dispatch(loginFailure('OAuth cancelled'));
        return;
      }

      // Get the ID token from the response
      const { access_token, id_token } = result.params as any;
      if (!id_token) {
        dispatch(loginFailure('No ID token received'));
        return;
      }

      // Call backend to exchange token for session
      const loginResult = await login({
        provider: 'google',
        idToken: id_token,
      }).unwrap();

      // Store tokens securely
      await tokenStorage.setAccessToken(loginResult.accessToken);
      await tokenStorage.setRefreshToken(loginResult.refreshToken);

      // Update Redux state
      dispatch(loginSuccess({
        user: loginResult.user,
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      }));
    } catch (error: any) {
      const message = error?.message || 'Authentication failed';
      console.error('Google Sign-In Error:', message);
      dispatch(loginFailure(message));
      throw error;
    }
  }, [dispatch, login, promptAsync]);

  return {
    signInWithGoogle,
    request,
  };
}
