import React, { useEffect } from "react";
import { Provider as ReduxProvider, useDispatch } from "react-redux";
import { store } from "./store";
import { RootNavigator } from "./navigation/RootNavigator";
import { AlertDialogProvider } from "./components/AlertDialog";
import { restoreSession } from "./store/slices/auth.slice";
import { tokenStorage } from "./utils/secureStore";
import { API_BASE_URL } from "./utils/constants";

/**
 * SessionRestorer
 *
 * On app launch, checks for a stored JWT token and verifies it
 * with the API. If valid, restores the user session automatically.
 */
function SessionRestorer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const restoreAuth = async () => {
      const token = await tokenStorage.getToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          dispatch(
            restoreSession({
              user: {
                id: userData.id || userData._id,
                email: userData.email,
                name: userData.name,
                image: userData.image,
                provider: "google",
              },
              token,
            })
          );
        } else {
          // Token is invalid or expired
          await tokenStorage.clearToken();
        }
      } catch (err) {
        console.error("Session restore failed:", err);
        // Don't clear token on network error - user may be offline
      }
    };

    restoreAuth();
  }, [dispatch]);

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
