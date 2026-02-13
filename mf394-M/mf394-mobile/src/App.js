import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ContactsProvider } from "./context/ContactsContext";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <ContactsProvider>
        <RootNavigator />
      </ContactsProvider>
    </AuthProvider>
  );
}
