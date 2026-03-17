/**
 * Platform-specific implementations handle this hook:
 *   useAppleAuth.native.ts — iOS & Android
 *
 * This file should never be reached by the bundler or Jest.
 * If it is, something is wrong with the platform resolution setup.
 */
export function useAppleAuth(): { signInWithApple: () => Promise<void>; isAvailable: boolean } {
  throw new Error(
    'useAppleAuth: no platform-specific implementation loaded. ' +
      'Expected useAppleAuth.native.ts to be resolved.'
  );
}
