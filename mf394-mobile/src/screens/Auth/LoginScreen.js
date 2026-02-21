import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { colors, spacing, typography, radii, shadows } from "../../theme/theme";

export default function LoginScreen() {
  const { isLoading, error } = useSelector((state) => state.auth);
  const { signInWithGoogle } = useGoogleAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoGlow}>
          <Image
            source={require("../../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.signInButtonDisabled]}
          onPress={signInWithGoogle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.neutral.bone[50]} />
          ) : (
            <Text style={styles.signInButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.semantic.background,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoGlow: {
    backgroundColor: colors.neutral.bone[100],
    borderRadius: radii.full,
    padding: spacing.xxl,
    opacity: 0.5,
  },
  logo: {
    width: 280,
    height: 88,
    marginBottom: spacing.md,
  },
  errorBox: {
    backgroundColor: colors.accent[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.error,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radii.md,
    width: "100%",
  },
  errorText: {
    color: colors.semantic.error,
    fontSize: typography.body.medium.fontSize,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: spacing.huge,
  },
  signInButton: {
    backgroundColor: colors.accent[500],
    paddingVertical: spacing.lg,
    borderRadius: radii.xl,
    alignItems: "center",
    ...shadows.md,
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: colors.neutral.bone[50],
    fontWeight: "600",
    fontSize: typography.title.medium.fontSize,
  },
});
