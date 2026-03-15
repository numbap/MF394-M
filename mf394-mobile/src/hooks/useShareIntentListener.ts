import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useShareIntent from 'expo-share-intent/build/useShareIntent';
import { setSharedImage } from '../store/slices/shareIntent.slice';

/**
 * Listens for images shared via the OS share sheet and stores
 * the URI in Redux so the navigator can route to Party Mode.
 */
export function useShareIntentListener() {
  const dispatch = useDispatch();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    resetOnBackground: false,
  });

  useEffect(() => {
    if (!hasShareIntent) return;
    if (shareIntent.type !== 'media' || !shareIntent.files?.length) return;

    const file = shareIntent.files[0];
    if (file?.path) {
      dispatch(setSharedImage(file.path));
      resetShareIntent(true);
    }
  }, [hasShareIntent, shareIntent, dispatch, resetShareIntent]);
}
