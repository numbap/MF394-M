import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { RootNavigator } from "./navigation/RootNavigator";
import { AlertDialogProvider } from "./components/AlertDialog";
import { ContactsProvider } from "./context/ContactsContext";

// As soon as the user logs in, we shoud list all of their contacts.
// When testing in mock mode, load the contacts from the mock data json file with the test user to simulate.

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ContactsProvider>
        <RootNavigator />
        <AlertDialogProvider />
      </ContactsProvider>
    </ReduxProvider>
  );
}
