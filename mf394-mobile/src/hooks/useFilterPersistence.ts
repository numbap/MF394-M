/**
 * useFilterPersistence
 *
 * Listens to AppState changes to persist and restore filter selections.
 * - On background/inactive: saves current filters + timestamp to AsyncStorage
 * - On foreground: restores filters if backgrounded less than 30 minutes ago
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreFilters, clearFilters } from '../store/slices/filters.slice';
import {
  saveFilterSnapshot,
  loadFilterSnapshot,
  clearFilterSnapshot,
  FILTER_EXPIRY_MS,
} from '../services/filterCache';

export function useFilterPersistence(): void {
  const dispatch = useAppDispatch();
  const selectedCategories = useAppSelector((state) => state.filters.selectedCategories);
  const selectedTags = useAppSelector((state) => state.filters.selectedTags);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const prevState = appStateRef.current;

      // App going to background or inactive — save snapshot
      if (prevState === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
        await saveFilterSnapshot(selectedCategories, selectedTags);
      }

      // App coming to foreground — check expiry and restore
      if ((prevState === 'background' || prevState === 'inactive') && nextAppState === 'active') {
        const snapshot = await loadFilterSnapshot();
        if (snapshot) {
          const elapsed = Date.now() - snapshot.backgroundedAt;
          if (elapsed < FILTER_EXPIRY_MS) {
            dispatch(restoreFilters({
              selectedCategories: snapshot.selectedCategories,
              selectedTags: snapshot.selectedTags,
            }));
          } else {
            dispatch(clearFilters());
            await clearFilterSnapshot();
          }
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch, selectedCategories, selectedTags]);
}
