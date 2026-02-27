import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { colors, spacing, typography, radii } from '../../theme/theme';

function StatCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const contacts = useSelector((state) => state.contacts?.data ?? []);

  const totalContacts = contacts.length;

  const byCategory = contacts.reduce((acc, c) => {
    const cat = c.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const withPhotos = contacts.filter((c) => c.imageUrl || c.photo).length;
  const withTags = contacts.filter((c) => c.tags && c.tags.length > 0).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Statistics</Text>

      <Text style={styles.sectionLabel}>Overview</Text>
      <View style={styles.row}>
        <StatCard label="Total Contacts" value={totalContacts} />
        <StatCard label="With Photos" value={withPhotos} />
        <StatCard label="Tagged" value={withTags} />
      </View>

      {Object.keys(byCategory).length > 0 && (
        <>
          <Text style={styles.sectionLabel}>By Category</Text>
          {Object.entries(byCategory).map(([cat, count]) => (
            <View key={cat} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{cat}</Text>
              <Text style={styles.categoryCount}>{count}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.label.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.primary[500],
  },
  cardLabel: {
    fontSize: typography.label.small.fontSize,
    color: colors.semantic.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
  },
  categoryName: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
  },
  categoryCount: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.primary[500],
  },
});
