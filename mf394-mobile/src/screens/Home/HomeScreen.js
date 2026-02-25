import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing, typography, radii } from "../../theme/theme";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to UmmYou</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Next Steps</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AddContact")}>
          <Text style={styles.buttonText}>+ Add Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate("PartyMode")}
        >
          <Text style={styles.buttonTextSecondary}>🎉 Party Mode</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.semantic.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: "700",
    color: colors.semantic.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.title.large.fontSize,
    fontWeight: "600",
    color: colors.semantic.text,
    marginBottom: spacing.md,
  },
  featureItem: {
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buttonSecondary: {
    backgroundColor: colors.accent[500],
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.large.fontSize,
  },
  buttonTextSecondary: {
    color: "#fff",
    fontWeight: "600",
    fontSize: typography.body.large.fontSize,
  },
  statusText: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
    lineHeight: 24,
  },
});
