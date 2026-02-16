import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { selectAuthUser } from '../../store/hooks';
import { useLogoutMutation } from '../../store/api/auth.api';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/auth.slice';
import { colors, spacing, radii, typography } from '../../theme/theme';

export default function SettingsScreen() {
  const user = useAppSelector(selectAuthUser);
  const [logoutMutation, { isLoading }] = useLogoutMutation();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logoutMutation().unwrap();
              dispatch(logout());
            } catch (error) {
              console.error('Logout failed:', error);
              dispatch(logout());
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.userSection}>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <Text style={styles.userProvider}>
          Signed in with {user?.provider || 'Google'}
        </Text>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging out...' : 'Log Out'}
          </Text>
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
  userSection: {
    alignItems: 'flex-start',
    paddingVertical: spacing.xxxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.border,
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
    backgroundColor: colors.accent[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.label.large,
    color: '#ffffff',
  },
});
