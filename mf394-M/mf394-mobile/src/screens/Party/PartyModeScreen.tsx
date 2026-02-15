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
} from 'react-native';
import { showAlert } from '../../utils/showAlert';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { BulkNamer, NamedFace } from '../../components/BulkNamer';
import { CategoryTagsStep } from '../../components/CategoryTagsStep';
import { FormButtons } from '../../components/FormButtons';
import { FormGroup } from '../../components/FormGroup';
import { LoadingState } from '../../components/LoadingState';
import { InfoBox } from '../../components/InfoBox';
import { Cropper } from '../../components/Cropper';
import { FullScreenSpinner } from '../../components/FullScreenSpinner';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { imageService } from '../../services/imageService';
import { Contact, useCreateContactMutation } from '../../store/api/contacts.api';
import { addContact } from '../../store/slices/contacts.slice';
import { addToQueue } from '../../store/slices/sync.slice';
import { CATEGORIES, DEFAULT_CATEGORY } from '../../constants';
import { AUTH_MOCK } from '../../utils/constants';
import { cropFaceWithBounds } from '../../utils/imageCropping';
import { TagManagementModal } from '../../components/TagManagementModal';

type Step = 'upload' | 'detecting' | 'naming' | 'category' | 'crop';

export default function PartyModeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>('upload');
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Array<{ id: string; uri: string }>>([]);
  const [namedFaces, setNamedFaces] = useState<NamedFace[]>([]);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Tag management modal state
  const [tagModalVisible, setTagModalVisible] = useState(false);

  const { detectFaces } = useFaceDetection();
  const [createContact] = useCreateContactMutation();

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep('detecting');

    try {
      const result = await detectFaces(uri);
      const faces = result?.faces || [];
      console.log('[PartyMode] Face detection complete:', faces.length, 'faces');

      if (!faces || faces.length === 0) {
        console.log('[PartyMode] No faces detected, forwarding to manual crop');
        setStep('crop');
        return;
      }

      // Process each detected face: crop and create face thumbnails
      // Use cropFaceWithBounds to avoid relying on hook state
      console.log('[PartyMode] Processing', faces.length, 'faces for cropping...');
      const processedFaces = await Promise.all(
        faces.map(async (face, index) => {
          try {
            const croppedUri = await cropFaceWithBounds(uri, face.bounds);
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
      showAlert('Error', 'Failed to detect faces. Please try again.');
      setStep('upload');
      setUploadedImageUri(null);
    }
  };

  const handleImageDeleted = () => {
    setUploadedImageUri(null);
    setDetectedFaces([]);
    setNamedFaces([]);
  };

  const handleCropConfirm = async (croppedImageUri: string) => {
    console.log('[PartyMode] Manual crop confirmed, proceeding to naming with one face');
    // Create a single face from the manually cropped image
    const singleFace = {
      id: 'face-0',
      uri: croppedImageUri,
    };
    setDetectedFaces([singleFace]);
    setStep('naming');
  };

  const handleCropCancel = () => {
    console.log('[PartyMode] Manual crop cancelled, returning to upload');
    setStep('upload');
    setUploadedImageUri(null);
  };

  const handleSave = async () => {
    if (namedFaces.length === 0) {
      showAlert('No Names', 'Please add at least one name before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const now = Date.now();

      // Process each named face
      for (const [index, namedFace] of namedFaces.entries()) {
        try {
          // Upload photo only in production mode
          let photoUrl = namedFace.faceUri;
          if (!AUTH_MOCK) {
            photoUrl = await imageService.uploadImage(namedFace.faceUri, {
              type: 'contact-photo',
              source: 'party-mode',
            });
          }

          // Create contact object with client-side temporary ID
          const tempId = `contact_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`;
          const newContact: Contact = {
            _id: tempId,
            name: namedFace.name.trim(),
            category: category as Contact['category'],
            groups: tags,
            photo: photoUrl,
            created: now,
            edited: now,
          };

          // STEP 1: Optimistic update - add to Redux immediately
          dispatch(addContact(newContact));

          // STEP 2: Queue for server sync (production mode only)
          if (!AUTH_MOCK) {
            // Prepare contact data for API (without temp ID)
            const apiContactData = {
              name: newContact.name,
              category: newContact.category,
              groups: newContact.groups,
              photo: newContact.photo,
              hint: newContact.hint,
              summary: newContact.summary,
            };

            // Queue the RTK Query mutation for background sync
            dispatch(
              addToQueue({
                id: `${tempId}_sync`,
                timestamp: now,
                action: {
                  type: 'contactsApi/executeMutation',
                  payload: {
                    endpoint: 'createContact',
                    data: apiContactData,
                    tempId: tempId, // For ID reconciliation later
                  },
                },
                retryCount: 0,
                maxRetries: 3,
              })
            );

            // Trigger immediate sync attempt (if online)
            dispatch({ type: 'sync/processSyncQueue' });
          }

          console.log(
            `[PartyMode] Saved contact ${index + 1}/${namedFaces.length}: ${newContact.name} (${AUTH_MOCK ? 'demo' : 'queued for sync'})`
          );
        } catch (error) {
          console.error(`Failed to process contact "${namedFace.name}":`, error);

          // Even on error, save locally with fallback
          const fallbackContact: Contact = {
            _id: `contact_${now}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            name: namedFace.name.trim(),
            category: category as Contact['category'],
            groups: tags,
            photo: namedFace.faceUri, // Use local URI as fallback
            created: now,
            edited: now,
          };
          dispatch(addContact(fallbackContact));
        }
      }

      // Success! All contacts saved locally
      setIsSaving(false);

      // Navigate to listing with filters applied
      navigation.navigate('Listing', {
        category,
        tags,
      });
    } catch (error: any) {
      console.error('Bulk save failed:', error);
      setSaveError(error?.message || 'Failed to create contacts. Please try again.');
      setIsSaving(false);
    }
  };

  const handleErrorBack = () => {
    setSaveError(null);
    setIsSaving(false);
  };

  const handleEditTags = () => {
    setTagModalVisible(true);
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
          <FormGroup>
            <ImageSelector
              imageUri={uploadedImageUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </FormGroup>

          {/* Info */}
          <FormGroup>
            <InfoBox text="Upload a photo with multiple faces. We'll detect each person and let you name them." />
          </FormGroup>

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
          <LoadingState
            title="Detecting Faces"
            subtitle="Analyzing your photo..."
          />
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

      {/* Manual Crop Step */}
      {step === 'crop' && uploadedImageUri && (
        <Cropper
          imageUri={uploadedImageUri}
          onCropConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          style={styles.stepContainer}
        />
      )}

      {/* Full-Screen Spinner */}
      <FullScreenSpinner
        visible={isSaving && !saveError}
        variant="loading"
        message={`Saving ${namedFaces.length} contact${namedFaces.length !== 1 ? 's' : ''}...`}
      />

      {/* Error State */}
      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ''}
        onBack={handleErrorBack}
      />

      {/* Tag Management Modal */}
      <TagManagementModal
        visible={tagModalVisible}
        onClose={() => setTagModalVisible(false)}
      />
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
