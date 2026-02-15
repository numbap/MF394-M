/**
 * showAlert Utility
 *
 * Drop-in replacement for React Native's Alert.alert that works on all platforms.
 * Uses event emitter pattern to trigger AlertDialog from anywhere in the app.
 *
 * Usage (identical to Alert.alert):
 * ```
 * import { showAlert } from '../utils/showAlert';
 *
 * showAlert('Title', 'Message', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Delete', onPress: handleDelete, style: 'destructive' },
 * ]);
 * ```
 */

import { EventEmitter } from 'events';
import { AlertButton } from '../components/AlertDialog';

interface AlertOptions {
  cancelable?: boolean;
}

interface ShowAlertPayload {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: AlertOptions;
}

// Global event emitter for alert triggers
export const alertEmitter = new EventEmitter();

/**
 * Show an alert dialog (drop-in replacement for Alert.alert)
 *
 * @param title - Alert title
 * @param message - Alert message (optional)
 * @param buttons - Alert buttons (optional, defaults to single OK button)
 * @param options - Alert options (optional)
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
): void {
  const payload: ShowAlertPayload = {
    title,
    message,
    buttons,
    options,
  };

  alertEmitter.emit('show', payload);
}
