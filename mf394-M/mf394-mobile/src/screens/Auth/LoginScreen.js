import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSelector } from "react-redux";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { colors, spacing, typography, radii } from "../../theme/theme";

export default function LoginScreen() {
  const { isLoading, error } = useSelector((state) => state.auth);
  const { signInWithGoogle } = useGoogleAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Face Memorizer</Text>
        <Text style={styles.subtitle}>Remember every face you meet</Text>
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
            <ActivityIndicator color="#fff" />
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
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: "700",
    marginBottom: spacing.md,
    color: colors.semantic.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.textSecondary,
    textAlign: "center",
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
    marginBottom: 40,
  },
  signInButton: {
    backgroundColor: colors.accent[500],
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
  },
  signInButtonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.title.medium.fontSize,
  },
});
