import React, { useEffect, useCallback } from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { RootState } from "../store";
import { colors } from "../theme/theme";
import { OfflineBanner } from "../components/OfflineBanner";
import { clearSharedImage } from "../store/slices/shareIntent.slice";
import { useOnboarding } from "../hooks/useOnboarding";

import LoginScreen from "../screens/Auth/LoginScreen";
import { ListingScreen } from "../screens/Listing";
import QuizGameScreen from "../screens/Games/QuizGameScreen";
import PracticeGameScreen from "../screens/Games/PracticeGameScreen";
// import StatsScreen from "../screens/Stats/StatsScreen";
import AddEditContactScreen from "../screens/AddEdit/AddEditContactScreen";
import PartyModeScreen from "../screens/Party/PartyModeScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import HelpScreen from "../screens/Help/HelpScreen";
import OnboardingScreen from "../screens/Onboarding/OnboardingScreen";

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

export const navigationRef = React.createRef();

export function RootNavigator() {
  const auth = useSelector((state: RootState) => state.auth);
  const user = auth?.user || null;
  const loginSessionKey = auth?.loginSessionKey || user?.id;

  const { needsOnboarding, isLoading: onboardingLoading, markComplete } = useOnboarding();

  const handleOnboardingComplete = useCallback(async () => {
    await markComplete();
  }, [markComplete]);

  return (
    <>
      <OfflineBanner />
      <NavigationContainer ref={navigationRef}>
        {!user ? (
          <UnauthenticatedStack />
        ) : onboardingLoading ? (
          <LoadingPlaceholder />
        ) : needsOnboarding ? (
          <OnboardingStack onComplete={handleOnboardingComplete} />
        ) : (
          <AuthenticatedStack key={loginSessionKey} />
        )}
      </NavigationContainer>
    </>
  );
}

function LoadingPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: colors.semantic.background }} />;
}

function OnboardingStack({ onComplete }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="Onboarding">
        {() => <OnboardingScreen onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
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
  const dispatch = useDispatch();
  const pendingImageUri = useSelector(
    (state: RootState) => state.shareIntent.pendingImageUri
  );

  useEffect(() => {
    if (!pendingImageUri) return;
    // Small delay to ensure navigation is mounted
    const timer = setTimeout(() => {
      if (navigationRef.current?.isReady()) {
        navigationRef.current.navigate("HomeTab", {
          screen: "PartyMode",
          params: { sharedImageUri: pendingImageUri },
        });
        dispatch(clearSharedImage());
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pendingImageUri, dispatch]);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'HomeTab') iconName = 'address-card';
          else if (route.name === 'HelpTab') iconName = 'question-circle';
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
        name="HelpTab"
        component={HelpStack}
        options={{
          title: "Help",
          tabBarLabel: "Help",
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
        options={{ title: "Contacts", headerShown: false }}
        
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
          title: "Party",
          headerLeft: ({ onPress, canGoBack }) => (
            <BackWithThumbnail
              onPress={canGoBack ? onPress : () => navigation.navigate("Listing")}
            />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function GamesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        options={{ title: "Quiz Game", headerShown: false  }}
      />
    </Stack.Navigator>
  );
}

function HelpStack() {
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
        name="Help"
        component={HelpScreen}
        options={{ title: "Help" }}
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
