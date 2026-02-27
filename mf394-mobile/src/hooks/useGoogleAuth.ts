/**
 * Platform-specific implementations handle this hook:
 *   useGoogleAuth.native.ts — iOS & Android
 *   useGoogleAuth.web.ts    — Web
 *
 * This file should never be reached by the bundler or Jest.
 * If it is, something is wrong with the platform resolution setup.
 */
export function useGoogleAuth(): { signInWithGoogle: () => Promise<void> } {
  throw new Error(
    'useGoogleAuth: no platform-specific implementation loaded. ' +
      'Expected useGoogleAuth.native.ts or useGoogleAuth.web.ts to be resolved.'
  );
}
