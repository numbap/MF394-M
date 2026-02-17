/**
 * Google OAuth Authentication Hook
 *
 * Handles cross-platform Google Sign-In using expo-auth-session.
 * After receiving ID token, exchanges it for a JWT via the live API.
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import {
  GOOGLE_OAUTH_CLIENT_ID_iOS,
  GOOGLE_OAUTH_CLIENT_ID_Android,
  GOOGLE_OAUTH_WEB_CLIENT_ID,
} from '../utils/constants';

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
    androidClientId: GOOGLE_OAUTH_CLIENT_ID_Android,
    webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
  });

  const signInWithGoogle = useCallback(async () => {
    if (!promptAsync) {
      dispatch(loginFailure('OAuth not available'));
      return;
    }

    try {
      dispatch(loginStart());

      const result = await promptAsync();
      if (result?.type !== 'success') {
        dispatch(loginFailure('Sign-in cancelled'));
        return;
      }

      const { id_token: idToken } = result.params as any;
      if (!idToken) {
        dispatch(loginFailure('No ID token received from Google'));
        return;
      }

      // Exchange Google ID token for app JWT
      const loginResult = await login({ idToken }).unwrap();

      // Store token securely
      await tokenStorage.setToken(loginResult.token);

      // Normalise user ID field (_id vs id)
      const userId = (loginResult.user as any)._id || (loginResult.user as any).id;

      // Update Redux state
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
