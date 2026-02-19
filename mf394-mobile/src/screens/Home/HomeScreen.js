import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { colors, spacing, typography, radii } from "../../theme/theme";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Face Memorizer</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Features</Text>
        <Text style={styles.featureItem}>✅ Contact management</Text>
        <Text style={styles.featureItem}>✅ Face detection</Text>
        <Text style={styles.featureItem}>✅ Photo upload to S3</Text>
        <Text style={styles.featureItem}>✅ Quiz game</Text>
        <Text style={styles.featureItem}>✅ Statistics tracking</Text>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Status</Text>
        <Text style={styles.statusText}>
          Application: ✅ Running{"\n"}
          Redux State: ✅ Connected{"\n"}
          Theme: ✅ Applied{"\n"}
          Components: ✅ Ready
        </Text>
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
