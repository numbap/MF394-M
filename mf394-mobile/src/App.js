import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import { store } from "./store";
import { RootNavigator } from "./navigation/RootNavigator";
import { AlertDialogProvider } from "./components/AlertDialog";
import { restoreSession, logout } from "./store/slices/auth.slice";
import { tokenStorage } from "./utils/secureStore";
import { API_BASE_URL } from "./utils/constants";
import { useShareIntentListener } from "./hooks/useShareIntentListener";
import { loadSession, loadUserData, saveSession, clearSessionCache } from "./services/sessionCache";
import { loadFilterSnapshot, clearFilterSnapshot, FILTER_EXPIRY_MS } from "./services/filterCache";
import { restoreFilters } from "./store/slices/filters.slice";
import { useFilterPersistence } from "./hooks/useFilterPersistence";
import { contactsApi } from "./store";

/**
 * SessionRestorer
 *
 * On app launch, instantly restores the session from local cache so the user
 * sees the app immediately. Then validates the token in the background —
 * only logging out on a confirmed 401.
 */
function SessionRestorer({ children }) {
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);
  useShareIntentListener();
  useFilterPersistence();

  useEffect(() => {
    const restoreAuth = async () => {
      // 1. Instantly restore from cache (no network needed)
      const [cached, cachedUserData, filterSnapshot] = await Promise.all([
        loadSession(),
        loadUserData(),
        loadFilterSnapshot(),
      ]);

      // Restore filters if backgrounded less than 30 minutes ago
      if (filterSnapshot) {
        const elapsed = Date.now() - filterSnapshot.backgroundedAt;
        if (elapsed < FILTER_EXPIRY_MS) {
          dispatch(restoreFilters({
            selectedCategories: filterSnapshot.selectedCategories,
            selectedTags: filterSnapshot.selectedTags,
          }));
        } else {
          clearFilterSnapshot();
        }
      }
      if (cached) {
        dispatch(restoreSession(cached));
      }
      // Seed RTK Query cache before ListingScreen mounts
      if (cachedUserData) {
        dispatch(contactsApi.util.upsertQueryData('getUser', undefined, cachedUserData));
      }

      // Cache is restored — safe to render the app
      setIsReady(true);

      // 2. Determine token to validate
      const token = cached?.token || (await tokenStorage.getToken());
      if (!token) return;

      // 3. Background-validate the token
      try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          const user = {
            id: userData.id || userData._id,
            email: userData.email,
            name: userData.name,
            image: userData.image,
            provider: "google",
          };
          dispatch(restoreSession({ user, token }));
          await saveSession(user, token);
        } else if (response.status === 401) {
          // Confirmed expired — clear everything
          await tokenStorage.clearToken();
          await clearSessionCache();
          await clearFilterSnapshot();
          dispatch(logout());
        }
        // Other errors (500, 503, etc.): keep cached session, do nothing
      } catch (err) {
        // Network error — keep cached session, user may be offline
      }
    };

    restoreAuth();
  }, [dispatch]);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return children;
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <SessionRestorer>
        <RootNavigator />
        <AlertDialogProvider />
      </SessionRestorer>
    </ReduxProvider>
  );
}
