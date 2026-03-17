import * as AppleAuthentication from 'expo-apple-authentication';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useAppleLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';

export function useAppleAuth() {
  const dispatch = useDispatch();
  const [isAvailable, setIsAvailable] = useState(false);
  const [appleLogin] = useAppleLoginMutation();

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  const signInWithApple = async () => {
    try {
      dispatch(loginStart());
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const name = credential.fullName
        ? {
            firstName: credential.fullName.givenName ?? undefined,
            lastName: credential.fullName.familyName ?? undefined,
          }
        : null;

      const result = await appleLogin({
        idToken: credential.identityToken!,
        provider: 'apple',
        ...(name && { name }),
      }).unwrap();

      await tokenStorage.setToken(result.token);
      dispatch(loginSuccess({ user: result.user, token: result.token }));
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        dispatch(loginFailure('Sign-in cancelled'));
      } else {
        dispatch(loginFailure(err?.message ?? 'Apple sign-in failed'));
      }
    }
  };

  return { signInWithApple, isAvailable };
}
