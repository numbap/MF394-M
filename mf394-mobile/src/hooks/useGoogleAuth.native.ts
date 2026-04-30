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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../store/hooks';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';
import { saveSession } from '../services/sessionCache';
import { GOOGLE_OAUTH_CLIENT_ID_iOS, GOOGLE_OAUTH_CLIENT_ID_Android, GOOGLE_OAUTH_WEB_CLIENT_ID } from '../utils/constants';

export function useGoogleAuth() {
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const isSigningIn = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      console.log('[GoogleAuth] configure webClientId:', GOOGLE_OAUTH_WEB_CLIENT_ID);
      console.log('[GoogleAuth] configure iosClientId:', GOOGLE_OAUTH_CLIENT_ID_iOS);
      GoogleSignin.configure({
        iosClientId: GOOGLE_OAUTH_CLIENT_ID_iOS,
        webClientId: GOOGLE_OAUTH_WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
      });
    } catch (error) {
      console.warn('GoogleSignin.configure failed:', error);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isSigningIn.current) return;
    isSigningIn.current = true;
    setIsLoading(true);

    dispatch(loginStart());

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();
      console.log('[GoogleAuth] signIn response keys:', Object.keys(userInfo));
      console.log('[GoogleAuth] idToken present:', !!userInfo.idToken);
      console.log('[GoogleAuth] data?.idToken present:', !!(userInfo as any).data?.idToken);
      const idToken = userInfo.idToken ?? (userInfo as any).data?.idToken;

      if (!idToken) {
        console.error('[GoogleAuth] No idToken. Full response:', JSON.stringify(userInfo, null, 2));
        dispatch(loginFailure('No ID token received from Google'));
        return;
      }

      // DEBUG: decode JWT payload to inspect aud claim
      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        console.log('[GoogleAuth] token aud:', payload.aud, '| iss:', payload.iss);
      } catch {}

      console.log('[GoogleAuth] calling backend login...');
      const loginResult = await login({ idToken }).unwrap();
      console.log('[GoogleAuth] backend login success, token present:', !!loginResult.token);
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
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        dispatch(loginFailure('Sign-in cancelled'));
      } else if (error.code === statusCodes.IN_PROGRESS) {
        dispatch(loginFailure('Sign-in already in progress'));
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        dispatch(loginFailure('Google Play Services not available'));
      } else {
        const message =
          error?.data?.error || error?.error || error?.message || 'Authentication failed';
        console.error('[GoogleAuth] login failed:', message, error);
        dispatch(loginFailure(message));
      }
    } finally {
      isSigningIn.current = false;
      setIsLoading(false);
    }
  }, [dispatch, login]);

  return { signInWithGoogle, isLoading };
}
