/**
 * Web fallback for useAppleAuth.
 * Apple Sign-In is not available on web, so this returns a no-op.
 * Native platforms use useAppleAuth.native.ts instead.
 */
export function useAppleAuth() {
  return {
    signInWithApple: async () => {},
    isAvailable: false,
    isLoading: false,
  };
}
