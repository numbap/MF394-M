import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { colors, spacing, typography, radii, shadows } from "../../theme/theme";

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Face Memorizer</Text>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome name="list" size={18} color={colors.semantic.text} />
          <Text style={styles.sectionTitle}>Features</Text>
        </View>
        <View style={styles.featureRow}>
          <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={styles.featureItem}>Contact management</Text>
        </View>
        <View style={styles.featureRow}>
          <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={styles.featureItem}>Face detection</Text>
        </View>
        <View style={styles.featureRow}>
          <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={styles.featureItem}>Photo upload to S3</Text>
        </View>
        <View style={styles.featureRow}>
          <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={styles.featureItem}>Quiz game</Text>
        </View>
        <View style={styles.featureRow}>
          <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
          <Text style={styles.featureItem}>Statistics tracking</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome name="rocket" size={18} color={colors.semantic.text} />
          <Text style={styles.sectionTitle}>Next Steps</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("AddContact")}>
          <FontAwesome name="user-plus" size={16} color={colors.neutral.bone[50]} />
          <Text style={styles.buttonText}>Add Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate("PartyMode")}
        >
          <FontAwesome name="users" size={16} color={colors.neutral.bone[50]} />
          <Text style={styles.buttonTextSecondary}>Party Mode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <FontAwesome name="info-circle" size={18} color={colors.semantic.text} />
          <Text style={styles.sectionTitle}>Status</Text>
        </View>
        <View style={styles.statusCard}>
          <View style={styles.featureRow}>
            <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
            <Text style={styles.statusText}>Application: Running</Text>
          </View>
          <View style={styles.featureRow}>
            <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
            <Text style={styles.statusText}>Redux State: Connected</Text>
          </View>
          <View style={styles.featureRow}>
            <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
            <Text style={styles.statusText}>Theme: Applied</Text>
          </View>
          <View style={styles.featureRow}>
            <FontAwesome name="check-circle" size={14} color={colors.semantic.success} />
            <Text style={styles.statusText}>Components: Ready</Text>
          </View>
        </View>
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
    ...typography.headline.large,
    color: colors.semantic.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title.large,
    color: colors.semantic.text,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  featureItem: {
    ...typography.body.large,
    color: colors.semantic.textSecondary,
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.accent[500],
  },
  buttonText: {
    color: colors.neutral.bone[50],
    fontWeight: "600",
    fontSize: typography.body.large.fontSize,
  },
  buttonTextSecondary: {
    color: colors.neutral.bone[50],
    fontWeight: "600",
    fontSize: typography.body.large.fontSize,
  },
  statusCard: {
    backgroundColor: colors.semantic.cardBackground,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.xs,
  },
  statusText: {
    ...typography.body.medium,
    color: colors.semantic.text,
  },
});
