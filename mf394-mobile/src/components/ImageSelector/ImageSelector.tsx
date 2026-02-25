import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paths, copyAsync } from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/theme';

interface ImageSelectorProps {
  imageUri?: string | null;
  onImageSelected: (uri: string) => void;
  onImageDeleted: () => void;
  placeholder?: React.ReactNode;
}

export function ImageSelector({
  imageUri,
  onImageSelected,
  onImageDeleted,
  placeholder,
}: ImageSelectorProps) {
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      // On Android, the Photo Picker returns content:// URIs that may expire after
      // the picker activity closes. expo-face-detector and expo-image-manipulator
      // also require file:// URIs. Copy to cache to get a stable file:// URI.
      if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const ext = result.assets[0].mimeType?.split('/')[1] || 'jpg';
        const cacheDir = Paths.cache.uri;
        const dest = `${cacheDir.endsWith('/') ? cacheDir : cacheDir + '/'}picked-${Date.now()}.${ext}`;
        await copyAsync({ from: uri, to: dest });
        uri = dest;
      }
      onImageSelected(uri);
    }
  };

  const handleLongPress = () => {
    if (imageUri) {
      onImageDeleted();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID="image-selector-container"
        style={styles.imageContainer}
        onPress={handlePickImage}
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        {imageUri ? (
          <Image
            testID="selected-image"
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
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
    maxWidth: 360,
    alignSelf: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
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
});
