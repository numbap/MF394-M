import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { loginSuccess } from "../../store/slices/auth.slice";
import { RootState } from "../../store";
import { colors, spacing, typography, radii } from "../../theme/theme";

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { error } = useSelector((state: RootState) => state.auth);

  const handleGoogleSignIn = () => {
    // Mock sign-in for development
    dispatch(
      loginSuccess({
        user: {
          id: "test-user-123",
          email: "test@example.com",
          name: "Test User",
          provider: "google",
        },
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      })
    );
  };

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
          style={styles.signInButton}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.signInButtonText}>Sign in with Google</Text>
        </TouchableOpacity>
        <Text style={styles.devNote}>
          (Mock sign-in for development - click to continue)
        </Text>
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
  signInButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.title.medium.fontSize,
  },
  devNote: {
    fontSize: typography.body.small.fontSize,
    color: colors.semantic.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
