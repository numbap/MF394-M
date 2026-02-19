/**
 * AlertDialog Component
 *
 * Cross-platform dialog that replaces React Native's Alert.alert
 * (which doesn't work on web). Provides consistent UX across all platforms.
 *
 * Features:
 * - Full-screen semi-transparent backdrop
 * - Centered dialog card with title, message, and buttons
 * - Support for 1-3 buttons with different styles (default, cancel, destructive)
 * - Simple show/hide (no animation)
 * - Uses theme tokens only
 *
 * Usage:
 * - Used via showAlert() utility for drop-in Alert.alert replacement
 * - Can also be used directly as a controlled component
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme/theme';
import { alertEmitter } from '../../utils/showAlert';

/**
 * Button configuration (matches Alert.alert API)
 */
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Props for AlertDialog component
 */
export interface AlertDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss: () => void;
  cancelable?: boolean;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onDismiss,
  cancelable = true,
}) => {
  const handleButtonPress = (button: AlertButton) => {
    // Call button's onPress handler if provided
    if (button.onPress) {
      button.onPress();
    }
    // Dismiss dialog
    onDismiss();
  };

  const handleBackdropPress = () => {
    if (cancelable) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBackdropPress}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleBackdropPress}>
        {/* Dialog Card */}
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.message}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = button.style || 'default';
              const isDestructive = buttonStyle === 'destructive';
              const isCancel = buttonStyle === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  testID={`alert-button-${index}`}
                  style={[
                    styles.button,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isDestructive && styles.buttonTextDestructive,
                      isCancel && styles.buttonTextCancel,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.semantic.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    maxWidth: 340,
    width: '100%',
    ...shadows.xl,
  },
  title: {
    fontSize: typography.title.medium.fontSize,
    fontWeight: typography.title.medium.fontWeight,
    color: colors.semantic.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.body.large.fontSize,
    fontWeight: typography.body.large.fontWeight,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: typography.body.large.lineHeight,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.huge,
  },
  buttonDestructive: {
    backgroundColor: colors.semantic.error,
  },
  buttonCancel: {
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.large.fontSize,
  },
  buttonTextDestructive: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: colors.semantic.text,
    fontWeight: '600',
  },
});

/**
 * AlertDialogProvider Component
 *
 * Global provider that listens to showAlert() calls and displays the dialog.
 * Must be mounted at app root level.
 *
 * Usage in App.js:
 * ```
 * import { AlertDialogProvider } from './components/AlertDialog';
 *
 * function App() {
 *   return (
 *     <>
 *       <RootNavigator />
 *       <AlertDialogProvider />
 *     </>
 *   );
 * }
 * ```
 */
export const AlertDialogProvider: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [buttons, setButtons] = useState<AlertButton[]>([{ text: 'OK' }]);
  const [cancelable, setCancelable] = useState(true);

  useEffect(() => {
    const handleShow = (payload: {
      title: string;
      message?: string;
      buttons?: AlertButton[];
      options?: { cancelable?: boolean };
    }) => {
      setTitle(payload.title);
      setMessage(payload.message);
      setButtons(payload.buttons || [{ text: 'OK' }]);
      setCancelable(payload.options?.cancelable ?? true);
      setVisible(true);
    };

    alertEmitter.on('show', handleShow);

    return () => {
      alertEmitter.off('show', handleShow);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AlertDialog
      visible={visible}
      title={title}
      message={message}
      buttons={buttons}
      onDismiss={handleDismiss}
      cancelable={cancelable}
    />
  );
};
