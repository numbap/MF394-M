/**
 * Google OAuth Authentication Hook (web)
 *
 * Handles Google Sign-In on web using expo-auth-session.
 * Uses a browser-based OAuth flow since the native GoogleSignin SDK
 * is unavailable on web.
 *
 * Flow:
 * 1. promptAsync() opens a browser popup for Google account selection
 * 2. Google returns an access_token via the implicit token flow
 * 3. Send accessToken to backend → backend calls Google userinfo → receive app JWT
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useWebLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import { GOOGLE_OAUTH_WEB_CLIENT_ID } from '../utils/constants';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [webLogin] = useWebLoginMutation();

  const redirectUri = AuthSession.makeRedirectUri({ path: 'api/auth/callback/google' });

  const [, response, promptAsync] = Google.useAuthRequest({
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

    const accessToken = response.params?.access_token;

    if (!accessToken) {
      dispatch(loginFailure('No access token received from Google'));
      return;
    }

    (async () => {
      try {
        console.log('[useGoogleAuth.web] sending accessToken:', accessToken?.slice(0, 20) + '...');
        const loginResult = await webLogin({ accessToken }).unwrap();
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
        console.log('[useGoogleAuth.web] login error:', JSON.stringify(error));
        const message =
          error?.data?.error || error?.error || error?.message || 'Authentication failed';
        dispatch(loginFailure(message));
      }
    })();
  }, [response, dispatch, webLogin]);

  const signInWithGoogle = useCallback(async () => {
    dispatch(loginStart());
    await promptAsync();
  }, [dispatch, promptAsync]);

  return { signInWithGoogle };
}
