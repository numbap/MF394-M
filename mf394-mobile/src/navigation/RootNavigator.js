import React, { useEffect } from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector } from "react-redux";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { RootState } from "../store";
import { colors } from "../theme/theme";
import { OfflineBanner } from "../components/OfflineBanner";

import LoginScreen from "../screens/Auth/LoginScreen";
import { ListingScreen } from "../screens/Listing";
import QuizGameScreen from "../screens/Games/QuizGameScreen";
import PracticeGameScreen from "../screens/Games/PracticeGameScreen";
// import StatsScreen from "../screens/Stats/StatsScreen";
import AddEditContactScreen from "../screens/AddEdit/AddEditContactScreen";
import PartyModeScreen from "../screens/Party/PartyModeScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";

const BackWithThumbnail = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}
  >
    <Ionicons name="chevron-back" size={24} color={colors.semantic.text} />
    <Image
      source={require("../../thumbnail.png")}
      style={{ width: 28, height: 28, borderRadius: 4 }}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth?.user || null;
  const loginSessionKey = auth?.loginSessionKey || user?.id;

  return (
    <>
      <OfflineBanner />
      <NavigationContainer>
        {user ? <AuthenticatedStack key={loginSessionKey} /> : <UnauthenticatedStack />}
      </NavigationContainer>
    </>
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
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'address-card';
          else if (route.name === 'QuizTab') iconName = 'trophy';
          else if (route.name === 'SettingsTab') iconName = 'cog';

          return <FontAwesome name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.semantic.textTertiary,
        headerShown: false,
      })}
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
        name="QuizTab"
        component={GamesStack}
        options={{
          title: "Quiz",
          tabBarLabel: "Quiz",
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          title: "Settings",
          tabBarLabel: "Settings",
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
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="Listing"
        component={ListingScreen}
        options={{ title: "Contacts" }}
      />
      <Stack.Screen
        name="AddContact"
        component={AddEditContactScreen}
        options={({ navigation }) => ({
          title: "Add Contact",
          headerLeft: ({ onPress }) => <BackWithThumbnail onPress={onPress} />,
        })}
      />
      <Stack.Screen
        name="EditContact"
        component={AddEditContactScreen}
        options={({ navigation }) => ({
          title: "Edit Contact",
          headerLeft: ({ onPress }) => <BackWithThumbnail onPress={onPress} />,
        })}
      />
      <Stack.Screen
        name="PartyMode"
        component={PartyModeScreen}
        options={({ navigation }) => ({
          title: "Party Mode",
          headerLeft: ({ onPress }) => <BackWithThumbnail onPress={onPress} />,
        })}
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
    </Stack.Navigator>
  );
}

function SettingsStack() {
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
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Stack.Navigator>
  );
}
