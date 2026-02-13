import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store";
import { RootNavigator } from "./navigation/RootNavigator";

export default function App() {
  return (
    <ReduxProvider store={store}>
      <RootNavigator />
    </ReduxProvider>
  );
}
