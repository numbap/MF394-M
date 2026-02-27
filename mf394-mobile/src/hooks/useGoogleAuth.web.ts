/**
 * Google OAuth Authentication Hook (web)
 *
 * Handles Google Sign-In on web using expo-auth-session.
 * Uses a browser-based OAuth flow since the native GoogleSignin SDK
 * is unavailable on web.
 *
 * Flow:
 * 1. promptAsync() opens a browser popup for Google account selection
 * 2. Google redirects back with an auth code
 * 3. expo-auth-session exchanges the code for tokens
 * 4. Send idToken to backend → receive app JWT
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import { GOOGLE_OAUTH_WEB_CLIENT_ID } from '../utils/constants';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'error') {
      dispatch(loginFailure(response.error?.message ?? 'Google authentication failed'));
      return;
    }

    if (response.type !== 'success') return;

    const idToken = response.params?.id_token;
    if (!idToken) {
      dispatch(loginFailure('No ID token received from Google'));
      return;
    }

    (async () => {
      try {
        const loginResult = await login({ idToken }).unwrap();
        await tokenStorage.setToken(loginResult.token);

        const userId = (loginResult.user as any)._id || (loginResult.user as any).id;

        dispatch(
          loginSuccess({
            user: {
              id: userId,
              email: loginResult.user.email,
              name: loginResult.user.name,
              image: loginResult.user.image,
              provider: 'google',
            },
            token: loginResult.token,
          })
        );
      } catch (error: any) {
        const message =
          error?.data?.error || error?.error || error?.message || 'Authentication failed';
        dispatch(loginFailure(message));
      }
    })();
  }, [response, dispatch, login]);

  const signInWithGoogle = useCallback(async () => {
    dispatch(loginStart());
    await promptAsync();
  }, [dispatch, promptAsync]);

  return { signInWithGoogle };
}
