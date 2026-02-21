import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useAppSelector } from '../../store/hooks';
import { selectAuthUser } from '../../store/hooks';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/auth.slice';
import { tokenStorage } from '../../utils/secureStore';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';

export default function SettingsScreen() {
  const user = useAppSelector(selectAuthUser);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await tokenStorage.clearToken();
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <FontAwesome name="user-circle" size={40} color={colors.primary[500]} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <Text style={styles.userProvider}>
            Signed in with {user?.provider || 'Google'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.semantic.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.sm,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.title.large,
    color: colors.semantic.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.body.medium,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.xs,
  },
  userProvider: {
    ...typography.body.small,
    color: colors.semantic.textTertiary,
  },
  actionsSection: {
    paddingTop: spacing.xxl,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent[500],
  },
  logoutButtonText: {
    ...typography.label.large,
    color: colors.accent[500],
  },
});
