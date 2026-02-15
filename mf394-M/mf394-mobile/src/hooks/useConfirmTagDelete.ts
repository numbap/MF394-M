/**
 * useConfirmTagDelete Hook
 *
 * Shows confirmation dialog before deleting a tag.
 * Displays count of affected contacts.
 */

import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { showAlert } from '../utils/showAlert';
import { Contact } from '../store/api/contacts.api';

export function useConfirmTagDelete() {
  const contacts = useSelector((state: RootState) => state.contacts.data);

  const confirmDelete = (tagName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Count affected contacts
      const affectedCount = contacts.filter(
        (contact: Contact) => contact.groups.includes(tagName)
      ).length;

      const message =
        affectedCount === 0
          ? `Delete '${tagName}' tag?`
          : `Delete '${tagName}' tag? This will remove it from ${affectedCount} contact${
              affectedCount !== 1 ? 's' : ''
            }.`;

      showAlert('Delete Tag?', message, [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => resolve(true),
        },
      ]);
    });
  };

  return { confirmDelete };
}
