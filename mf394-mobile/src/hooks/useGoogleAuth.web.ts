/**
 * Google OAuth Authentication Hook (web)
 *
 * Handles Google Sign-In on web using expo-auth-session.
 * Uses a browser-based OAuth flow since the native GoogleSignin SDK
 * is unavailable on web.
 *
 * Flow:
 * 1. promptAsync() opens a browser popup for Google account selection
 * 2. Google returns an id_token (JWT) via the implicit ID token flow
 * 3. Send idToken to backend → backend verifies with Google → receive app JWT
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import { saveSession } from '../services/sessionCache';
import { GOOGLE_OAUTH_WEB_CLIENT_ID } from '../utils/constants';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();

  const redirectUri = AuthSession.makeRedirectUri({ path: 'api/auth/callback/google' });

  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
    redirectUri,
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
        console.log('[useGoogleAuth.web] sending idToken:', idToken?.slice(0, 20) + '...');
        const loginResult = await login({ idToken }).unwrap();
        await tokenStorage.setToken(loginResult.token);

        const userId = (loginResult.user as any)._id || (loginResult.user as any).id;

        const user = {
          id: userId,
          email: loginResult.user.email,
          name: loginResult.user.name,
          image: loginResult.user.image,
          provider: 'google' as const,
        };
        dispatch(loginSuccess({ user, token: loginResult.token }));
        saveSession(user, loginResult.token);
      } catch (error: any) {
        console.log('[useGoogleAuth.web] login error:', JSON.stringify(error));
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

  return { signInWithGoogle, isLoading: false };
}
