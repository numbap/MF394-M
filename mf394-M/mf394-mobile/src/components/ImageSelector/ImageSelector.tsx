import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/theme';

interface ImageSelectorProps {
  imageUri?: string | null;
  onImageSelected: (uri: string) => void;
  onImageDeleted: () => void;
  placeholder?: React.ReactNode;
  height?: number;
}

export function ImageSelector({
  imageUri,
  onImageSelected,
  onImageDeleted,
  placeholder,
  height = 200,
}: ImageSelectorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !!imageUri,
      onMoveShouldSetPanResponder: () => !!imageUri,
      onPanResponderGrant: () => {
        if (imageUri) {
          setShowDeleteConfirm(true);
        }
      },
    })
  ).current;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteConfirm = () => {
    onImageDeleted();
    setShowDeleteConfirm(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.imageContainer, { height }]}
        onPress={handlePickImage}
        {...(imageUri ? panResponder.panHandlers : {})}
        activeOpacity={0.7}
      >
        {imageUri && !showDeleteConfirm ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : showDeleteConfirm ? (
          <View style={styles.deletePrompt}>
            <View style={styles.deleteContent}>
              <FontAwesome name="trash" size={32} color={colors.semantic.error} />
              <Text style={styles.deleteTitle}>Delete Image?</Text>
              <Text style={styles.deleteSubtext}>
                Press and hold to confirm, or tap elsewhere to cancel
              </Text>
              <View style={styles.deleteActions}>
                <TouchableOpacity
                  style={styles.deleteCancel}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteConfirm}
                  onPress={handleDeleteConfirm}
                  onLongPress={handleDeleteConfirm}
                >
                  <Text style={styles.deleteConfirmText}>Hold to Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.uploadPrompt}>
            <FontAwesome name="camera" size={48} color={colors.semantic.textSecondary} />
            {placeholder ? (
              placeholder
            ) : (
              <>
                <Text style={styles.uploadLabel}>Add Photo</Text>
                <Text style={styles.uploadSubtext}>Tap to upload</Text>
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: colors.semantic.border,
    borderRadius: radii.lg,
    backgroundColor: colors.semantic.surface,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  uploadPrompt: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.semantic.textSecondary,
  },
  deletePrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  deleteContent: {
    backgroundColor: colors.semantic.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.semantic.text,
  },
  deleteSubtext: {
    fontSize: 14,
    color: colors.semantic.textSecondary,
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  deleteCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    alignItems: 'center',
  },
  deleteCancelText: {
    color: colors.semantic.text,
    fontWeight: '600',
  },
  deleteConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.semantic.error,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
