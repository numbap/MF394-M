/**
 * Google OAuth Authentication Hook
 *
 * Handles Google Sign-In using @react-native-google-signin/google-signin (native SDK).
 *
 * Flow (real auth):
 * 1. GoogleSignin.signIn() opens native Google account picker
 * 2. Extract idToken from the result
 * 3. Send idToken to backend → receive app JWT
 *
 * Development flow (AUTH_MOCK=true in .env):
 * - Bypasses Google entirely, logs in instantly with a dev user.
 *
 * Web:
 * - GoogleSignin NativeModule is unavailable on web; web auth is handled separately.
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import {
  GOOGLE_OAUTH_CLIENT_ID_iOS,
  GOOGLE_OAUTH_WEB_CLIENT_ID,
  AUTH_MOCK,
} from '../utils/constants';

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const isSigningIn = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    GoogleSignin.configure({
      iosClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
      webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
      scopes: ['profile', 'email'],
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isSigningIn.current) return;
    isSigningIn.current = true;

    dispatch(loginStart());

    // ── Mock auth bypass ──────────────────────────────────────────────────────
    if (AUTH_MOCK === 'true') {
      dispatch(
        loginSuccess({
          user: {
            id: 'mock-user-1',
            email: 'dev@ummyou.com',
            name: 'Dev User',
            image: null,
            provider: 'google',
          },
          token: 'mock-jwt-token',
        })
      );
      isSigningIn.current = false;
      return;
    }

    // ── Web guard ─────────────────────────────────────────────────────────────
    if (Platform.OS === 'web') {
      dispatch(loginFailure('Google Sign-In native SDK is not available on web.'));
      isSigningIn.current = false;
      return;
    }

    // ── Native Google Sign-In ─────────────────────────────────────────────────
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken ?? (userInfo as any).data?.idToken;

      if (!idToken) {
        dispatch(loginFailure('No ID token received from Google'));
        return;
      }

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
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        dispatch(loginFailure('Sign-in cancelled'));
      } else if (error.code === statusCodes.IN_PROGRESS) {
        dispatch(loginFailure('Sign-in already in progress'));
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        dispatch(loginFailure('Google Play Services not available'));
      } else {
        const message =
          error?.data?.error || error?.error || error?.message || 'Authentication failed';
        dispatch(loginFailure(message));
        throw error;
      }
    } finally {
      isSigningIn.current = false;
    }
  }, [dispatch, login]);

  return { signInWithGoogle };
}
