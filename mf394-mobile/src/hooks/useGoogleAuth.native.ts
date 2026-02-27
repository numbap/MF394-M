/**
 * Google OAuth Authentication Hook (native)
 *
 * Handles Google Sign-In using @react-native-google-signin/google-signin (native SDK).
 *
 * Flow:
 * 1. GoogleSignin.signIn() opens native Google account picker
 * 2. Extract idToken from the result
 * 3. Send idToken to backend → receive app JWT
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import { GOOGLE_OAUTH_CLIENT_ID_iOS, GOOGLE_OAUTH_WEB_CLIENT_ID } from '../utils/constants';

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const isSigningIn = useRef(false);

  useEffect(() => {
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
