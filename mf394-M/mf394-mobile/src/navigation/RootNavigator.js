import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { restoreSession } from "../store/slices/auth.slice";
import { tokenStorage } from "../utils/secureStore";
import { colors } from "../theme/theme";

import LoginScreen from "../screens/Auth/LoginScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import QuizGameScreen from "../screens/Games/QuizGameScreen";
import PracticeGameScreen from "../screens/Games/PracticeGameScreen";
import StatsScreen from "../screens/Stats/StatsScreen";
import AddEditContactScreen from "../screens/AddEdit/AddEditContactScreen";
import PartyModeScreen from "../screens/Party/PartyModeScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth?.user || null;

  return (
    <NavigationContainer>
      {user ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
}

function UnauthenticatedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.semantic.textTertiary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: "Contacts",
          tabBarLabel: "Contacts",
        }}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesStack}
        options={{
          title: "Games",
          tabBarLabel: "Games",
        }}
      />
      <Tab.Screen
        name="StatsTab"
        component={StatsScreen}
        options={{
          title: "Stats",
          tabBarLabel: "Stats",
        }}
      />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.semantic.background,
        },
        headerTintColor: colors.semantic.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Contacts" }}
      />
      <Stack.Screen
        name="AddContact"
        component={AddEditContactScreen}
        options={{ title: "Add Contact" }}
      />
      <Stack.Screen
        name="PartyMode"
        component={PartyModeScreen}
        options={{ title: "Party Mode" }}
      />
    </Stack.Navigator>
  );
}

function GamesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.semantic.background,
        },
        headerTintColor: colors.semantic.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="Quiz"
        component={QuizGameScreen}
        options={{ title: "Quiz Game" }}
      />
      <Stack.Screen
        name="Practice"
        component={PracticeGameScreen}
        options={{ title: "Practice Game" }}
      />
    </Stack.Navigator>
  );
}
