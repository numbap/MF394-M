import * as AppleAuthentication from 'expo-apple-authentication';
import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/auth.slice';
import { useAppleLoginMutation } from '../store/api/auth.api';
import { tokenStorage } from '../utils/secureStore';

export function useAppleAuth() {
  const dispatch = useDispatch();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [appleLogin] = useAppleLoginMutation();

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  const signInWithApple = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      dispatch(loginStart());

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

      const userId = (result.user as any)._id || (result.user as any).id;
      await tokenStorage.setToken(result.token);
      dispatch(loginSuccess({
        user: {
          id: userId,
          email: result.user.email,
          name: result.user.name,
          image: result.user.image,
          provider: 'apple',
        },
        token: result.token,
      }));
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED') {
        dispatch(loginFailure('Sign-in cancelled'));
      } else {
        const message = err?.data?.error || err?.error || err?.message || 'Apple sign-in failed';
        dispatch(loginFailure(message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { signInWithApple, isAvailable, isLoading };
}
