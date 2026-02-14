/**
 * Party Mode Screen
 *
 * Allows users to upload group photos and create multiple contacts at once.
 *
 * Flow:
 * 1. Upload image
 * 2. Face detection (loading)
 * 3. Name each face (validation: red → green border)
 * 4. Select category + tags
 * 5. Bulk save (create all validated contacts)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { BulkNamer, NamedFace } from '../../components/BulkNamer';
import { CategoryTagsStep } from '../../components/CategoryTagsStep';
import { type Category } from '../../components/CategorySelector';
import { FormButtons } from '../../components/FormButtons';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import * as imageService from '../../services/imageService';
import { useCreateContactMutation } from '../../store/api/contacts.api';

type Step = 'upload' | 'detecting' | 'naming' | 'category' | 'saving';

const CATEGORIES: Category[] = [
  { label: 'Friends & Family', value: 'friends-family', icon: 'heart' },
  { label: 'Community', value: 'community', icon: 'users' },
  { label: 'Work', value: 'work', icon: 'briefcase' },
  { label: 'Goals & Hobbies', value: 'goals-hobbies', icon: 'star' },
  { label: 'Miscellaneous', value: 'miscellaneous', icon: 'folder' },
];

const AVAILABLE_TAGS = [
  'friend',
  'family',
  'work-colleague',
  'mentor',
  'student',
  'neighbor',
  'volunteer',
  'teammate',
];

export default function PartyModeScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('upload');
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Array<{ id: string; uri: string }>>([]);
  const [namedFaces, setNamedFaces] = useState<NamedFace[]>([]);
  const [category, setCategory] = useState<string>('friends-family');
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { detectFaces, cropFace } = useFaceDetection();
  const [createContact] = useCreateContactMutation();

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep('detecting');

    try {
      const result = await detectFaces(uri);
      const faces = result?.faces || [];
      console.log('[PartyMode] Face detection complete:', faces.length, 'faces');

      if (!faces || faces.length === 0) {
        Alert.alert('No Faces Found', 'Could not detect any faces in this image. Try another photo.');
        setStep('upload');
        setUploadedImageUri(null);
        return;
      }

      // Process each detected face: crop and create face thumbnails
      console.log('[PartyMode] Processing', faces.length, 'faces for cropping...');
      const processedFaces = await Promise.all(
        faces.map(async (face, index) => {
          try {
            const croppedUri = await cropFace(uri, index);
            console.log(`[PartyMode] Successfully cropped face ${index}`);
            return {
              id: `face-${index}`,
              uri: croppedUri,
            };
          } catch (error) {
            console.warn(`[PartyMode] Failed to crop face ${index}:`, error);
            // Fallback to full image if crop fails
            return {
              id: `face-${index}`,
              uri: uri,
            };
          }
        })
      );

      console.log('[PartyMode] All faces processed:', processedFaces.length);
      setDetectedFaces(processedFaces);
      console.log('[PartyMode] Setting step to naming');
      setStep('naming');
    } catch (error: any) {
      console.error('[PartyMode] Error during face detection:', error);
      Alert.alert('Error', 'Failed to detect faces. Please try again.');
      setStep('upload');
      setUploadedImageUri(null);
    }
  };

  const handleImageDeleted = () => {
    setUploadedImageUri(null);
    setDetectedFaces([]);
    setNamedFaces([]);
  };

  const handleSave = async () => {
    if (namedFaces.length === 0) {
      Alert.alert('No Names', 'Please add at least one name before saving.');
      return;
    }

    setIsSaving(true);

    try {
      // Create all contacts in parallel
      const createPromises = namedFaces.map(async (namedFace) => {
        try {
          // Compress and upload each face photo
          const s3Url = await imageService.uploadImage(namedFace.faceUri, {
            type: 'contact-photo',
            source: 'party-mode',
          });

          // Create contact
          const contactData = {
            name: namedFace.name.trim(),
            category,
            groups: tags,
            photo: s3Url,
          };

          return await createContact(contactData).unwrap();
        } catch (error) {
          console.error(`Failed to create contact "${namedFace.name}":`, error);
          throw error;
        }
      });

      const results = await Promise.all(createPromises);

      // Success!
      Alert.alert(
        'Success!',
        `Created ${results.length} contact${results.length !== 1 ? 's' : ''} from party mode`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset and return to home
              setUploadedImageUri(null);
              setDetectedFaces([]);
              setNamedFaces([]);
              setStep('upload');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Bulk save failed:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to create some contacts. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditTags = () => {
    Alert.alert('Tag Management', 'Tag editing interface coming soon');
  };

  const canSave = namedFaces.length > 0 && !isSaving;

  return (
    <View style={styles.container}>
      {/* Upload Step */}
      {step === 'upload' && (
        <ScrollView style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Party Mode</Text>
          <Text style={styles.stepSubtitle}>Upload a group photo to create multiple contacts</Text>

          {/* Image Selector */}
          <View style={styles.formGroup}>
            <ImageSelector
              imageUri={uploadedImageUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <FontAwesome name="info-circle" size={20} color={colors.primary[500]} />
            <Text style={styles.infoText}>
              Upload a photo with multiple faces. We'll detect each person and let you name them.
            </Text>
          </View>

          {/* Back Button */}
          <FormButtons
            cancelButton={{
              label: 'Back',
              icon: 'arrow-left',
              onPress: () => navigation.goBack(),
            }}
          />
        </ScrollView>
      )}

      {/* Face Detection Step */}
      {step === 'detecting' && (
        <View style={styles.stepContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingLabel}>Detecting Faces</Text>
            <Text style={styles.loadingSubtext}>Analyzing your photo...</Text>
          </View>
        </View>
      )}

      {/* Naming Step */}
      {step === 'naming' && detectedFaces.length > 0 && (
        <View style={styles.namingStepContainer}>
          <BulkNamer
            faces={detectedFaces}
            onNamesChange={setNamedFaces}
            initialNames={namedFaces}
            style={styles.bulkNamerContent}
          />

          {/* Navigation Buttons */}
          <View style={styles.buttonFooter}>
            <FormButtons
              primaryButton={{
                label: `Continue (${namedFaces.length})`,
                icon: 'arrow-right',
                onPress: () => setStep('category'),
                disabled: !namedFaces.length,
              }}
              cancelButton={{
                label: 'Back to Upload',
                icon: 'arrow-left',
                onPress: () => {
                  setStep('upload');
                  setUploadedImageUri(null);
                  setDetectedFaces([]);
                  setNamedFaces([]);
                },
              }}
            />
          </View>
        </View>
      )}

      {/* Category + Tags Step */}
      {step === 'category' && (
        <CategoryTagsStep
          contactCount={namedFaces.length}
          category={category}
          tags={tags}
          categories={CATEGORIES}
          availableTags={AVAILABLE_TAGS}
          contacts={namedFaces.map((face) => ({
            id: face.id,
            name: face.name,
          }))}
          onCategoryChange={setCategory}
          onTagsChange={setTags}
          onEditTags={handleEditTags}
          onSave={handleSave}
          onBack={() => setStep('naming')}
          isSaving={isSaving}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.semantic.background,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.headline.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.semantic.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingLabel: {
    fontSize: typography.title.large.fontSize,
    fontWeight: '700',
    color: colors.semantic.text,
  },
  loadingSubtext: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
  },
  namingStepContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: colors.semantic.background,
  },
  bulkNamerContent: {
    flex: 1,
  },
  buttonFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.semantic.background,
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
  },
});
