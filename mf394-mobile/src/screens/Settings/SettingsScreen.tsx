import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppSelector } from '../../store/hooks';
import { selectAuthUser } from '../../store/hooks';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/auth.slice';
import { contactsApi, authApi, tagsApi, uploadApi, extractApi } from '../../store';
import { useDeleteAccountMutation } from '../../store/api/auth.api';
import { tokenStorage } from '../../utils/secureStore';
import { clearSessionCache } from '../../services/sessionCache';
import { clearFilterSnapshot } from '../../services/filterCache';
import { showAlert } from '../../utils/showAlert';
import { colors, spacing, radii, typography } from '../../theme/theme';

export default function SettingsScreen() {
  const user = useAppSelector(selectAuthUser);
  const dispatch = useDispatch();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const clearAllState = async () => {
    dispatch(logout());
    dispatch(contactsApi.util.resetApiState());
    dispatch(authApi.util.resetApiState());
    dispatch(tagsApi.util.resetApiState());
    dispatch(uploadApi.util.resetApiState());
    dispatch(extractApi.util.resetApiState());
    await tokenStorage.clearToken();
    await clearSessionCache();
    await clearFilterSnapshot();
  };

  const handleLogout = async () => {
    await clearAllState();
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount().unwrap();
              await clearAllState();
            } catch {
              // Error middleware handles the toast automatically
            }
          },
        },
      ],
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
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deleteSection}>
        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
          accessibilityRole="button"
          accessibilityLabel="Delete Account"
        >
          <Text style={styles.deleteButtonText}>
            {isDeleting ? 'Deleting Account...' : 'Delete Account'}
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
  deleteSection: {
    paddingTop: spacing.xxxl,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    ...typography.label.large,
    color: colors.semantic.error,
  },
});
