/**
 * Add/Edit Contact Screen
 *
 * Page layout from top ot bottom:
 * Image selector tool:
 *  > There should be one component to display current image and also perform uploads. If there is already an image displayed in that component, it acts as a thumbnail. If you press and hold, it will delete the image (local only) And then it will turn into an upload button. Clicking the upload button will open the file selection tool.
    > This app does not access the camera. Only photo upload.
 * Form with validation for name, hint and summary
 * Category + Tags selector.
 *  > Categories are fixed and required. Tags are optional and user defined.
 *  > Categories should be a dropdown menu with icons.
 *  > Tags should be a prepopulated list of tags that the user can select. Available tags are defined globally in an other interface.
 * > The tags are not an iput form. They're just a set of tag buttons that can be pressed. There is also an edit button that will take the user to the interface where they can manage tags. But tag modification is not done wihtin this modal. 
    * Add/Save, Delete and Cancel Buttons
 *  > Button will say Add for new contacts, and Save for editing existing contacts.
 *  > Delete buttons should only appear when editing a contact.
 *  > There should be space between the Cancel button and the Add/Save + Delete buttons.
 * 
 * When an image is uploaded.
 *  > When a user uploads an image with the image selector tool, the page will turn to a spinner that says "Scanning for Faces", and then one of 3 things will happen:
 * 1. If no faces are detected, it will load the cropper.
 * 2. If faces are detected, it will show a new screen showing all found faces, and the user can select the face that corresponds with the contact they are tryin to create.
 * 3. If an invalid file is uploaded, display an error message and return to the details form.

 *    The tags should look like badges. When you click on it, it shold change color. But no icons should appear in the badge. Badge with should be the same when activated or deactivated. 

 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useCreateContactMutation } from '../../store/api/contacts.api';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { CategorySelector, Category } from '../../components/CategorySelector';
import { TagSelector } from '../../components/TagSelector';
import { FaceSelector, Face } from '../../components/FaceSelector';
import { Cropper } from '../../components/Cropper';
import { FormButtons } from '../../components/FormButtons';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { imageService } from '../../services/imageService';

// Helper function to crop a face using bounds directly (for display)
// This avoids relying on hook state which may not be updated yet
async function cropFaceWithBounds(
  imageUri: string,
  bounds: { origin: { x: number; y: number }; size: { width: number; height: number } },
  padding: number = 20
): Promise<string> {
  if (Platform.OS === 'web') {
    return await cropFaceWebWithBounds(imageUri, bounds, padding);
  } else {
    // For native, use ImageManipulator
    try {
      const { ImageManipulator } = require('expo-image-manipulator');
      const cropRegion = {
        originX: Math.max(0, bounds.origin.x - padding),
        originY: Math.max(0, bounds.origin.y - padding),
        width: Math.min(bounds.size.width + padding * 2, 800),
        height: Math.min(bounds.size.height + padding * 2, 800),
      };
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: cropRegion }],
        { compress: 0.9, format: 'jpeg' }
      );
      return result.uri;
    } catch (err) {
      console.error('Native crop failed:', err);
      return await cropFaceWebWithBounds(imageUri, bounds, padding);
    }
  }
}

// Web-specific face cropping using canvas
async function cropFaceWebWithBounds(
  imageUri: string,
  bounds: { origin: { x: number; y: number }; size: { width: number; height: number } },
  padding: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let uriToLoad = imageUri;

      if (imageUri.startsWith('file://')) {
        fetch(imageUri)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            loadAndCropImageWithBounds(blobUrl, bounds, padding, resolve, reject);
          })
          .catch((err) => {
            console.error('Failed to fetch file:', err);
            reject(err);
          });
      } else {
        loadAndCropImageWithBounds(uriToLoad, bounds, padding, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Helper to load and crop using DOM Image constructor
function loadAndCropImageWithBounds(
  imageUri: string,
  bounds: { origin: { x: number; y: number }; size: { width: number; height: number } },
  padding: number,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) {
  // Use DOM Image constructor, not React Native Image
  const img = new (window as any).Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    try {
      const originX = Math.max(0, bounds.origin.x - padding);
      const originY = Math.max(0, bounds.origin.y - padding);
      const cropWidth = Math.min(
        bounds.size.width + padding * 2,
        img.width - originX
      );
      const cropHeight = Math.min(
        bounds.size.height + padding * 2,
        img.height - originY
      );

      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(`Invalid crop dimensions: ${cropWidth}x${cropHeight}`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(
        img,
        originX,
        originY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);

      if (imageUri.startsWith('blob:')) {
        URL.revokeObjectURL(imageUri);
      }

      resolve(croppedImageUrl);
    } catch (error) {
      console.error('Crop failed:', error);
      reject(error);
    }
  };

  img.onerror = (err) => {
    console.error('Image load failed:', err);
    reject(new Error(`Failed to load image: ${imageUri}`));
  };

  img.src = imageUri;
}

type Step = 'details' | 'faceDetection' | 'faceSelection' | 'crop' | 'save';

const CATEGORIES: Category[] = [
  { label: 'Friends & Family', value: 'friends-family', icon: 'heart' },
  { label: 'Community', value: 'community', icon: 'users' },
  { label: 'Work', value: 'work', icon: 'briefcase' },
  { label: 'Goals & Hobbies', value: 'goals-hobbies', icon: 'star' },
  { label: 'Miscellaneous', value: 'miscellaneous', icon: 'folder' },
];

// Prepopulated tags - TODO: Load from API/global state
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

export default function AddEditContactScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('details');
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<string>('friends-family');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Image processing state
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(0);

  // API mutations
  const [createContact] = useCreateContactMutation();
  const { detectFaces, cropFace, faces: detectionFaces } = useFaceDetection();

  // Determine if editing or creating
  const isEditing = false; // TODO: Get from route params

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep('faceDetection');

    // Start face detection
    try {
      const result = await detectFaces(uri);
      const { faces, isRealDetection } = result;

      if (isRealDetection && faces && faces.length > 0) {
        // Only show face selector if real faces were detected
        // Crop all faces for display before showing in FaceSelector.
        // This ensures each face in the grid shows the cropped headshot,
        // not the full original image. Use detected face bounds directly
        // rather than relying on hook state which may not be updated yet.
        const croppedFaces = await Promise.all(
          faces.map(async (face) => {
            try {
              const croppedUri = await cropFaceWithBounds(uri, face.bounds);
              return {
                ...face,
                uri: croppedUri, // Use cropped image for display
              };
            } catch (err) {
              console.error(`Failed to crop face ${face.id}:`, err);
              return face; // Fallback to original if cropping fails
            }
          })
        );
        setDetectedFaces(croppedFaces);
        setSelectedFaceIndex(0);
        setStep('faceSelection');
      } else {
        // No real faces detected - go to manual cropping interface
        setStep('crop');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setStep('details');
      setUploadedImageUri(null);
    }
  };

  const handleFaceSelected = async (faceIndex: number) => {
    setSelectedFaceIndex(faceIndex);
    setIsLoading(true);

    try {
      // Use the already-cropped image from the grid, not crop again
      const selectedFace = detectedFaces[faceIndex];
      if (!selectedFace) {
        throw new Error('Face not found');
      }

      // Store locally - upload will happen when saving contact
      setPhotoUri(selectedFace.uri);

      // Return to details screen
      setStep('details');
    } catch (error: any) {
      console.error('Image processing failed:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to process image. Please try again.'
      );
      // Keep on faceSelection screen to retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropManually = () => {
    setStep('crop');
  };

  const handleCropConfirm = async (croppedImageUri: string) => {
    try {
      setIsLoading(true);

      // Store locally - upload will happen when saving contact
      setPhotoUri(croppedImageUri);

      // Return to details screen
      setStep('details');
    } catch (error: any) {
      console.error('Crop failed:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to process image. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropCancel = () => {
    setStep('details');
    setUploadedImageUri(null);
  };

  const handleImageDeleted = () => {
    setPhotoUri(null);
  };

  const handleSave = async () => {
    // Validate form before saving
    if (!isFormValid()) {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter a name');
      } else {
        Alert.alert('Error', 'Please provide either a photo or a hint');
      }
      return;
    }

    try {
      setIsLoading(true);

      // Upload photo to S3 if one is selected
      let uploadedPhotoUrl = photoUri;
      const isMockMode = process.env.AUTH_MOCK === 'true';

      if (photoUri && !isMockMode) {
        try {
          uploadedPhotoUrl = await imageService.uploadImage(photoUri, {
            type: 'contact-photo',
          });
        } catch (uploadError: any) {
          console.error('Photo upload failed:', uploadError);
          Alert.alert(
            'Upload Error',
            'Failed to upload photo. Save contact without photo?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Save Without Photo',
                onPress: async () => {
                  uploadedPhotoUrl = undefined;
                  await saveContactData(uploadedPhotoUrl);
                },
              },
            ]
          );
          return;
        }
      }

      await saveContactData(uploadedPhotoUrl);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
  };

  const saveContactData = async (photoUrl: string | null | undefined) => {
    const contactData = {
      name: name.trim(),
      hint: hint.trim() || undefined,
      summary: summary.trim() || undefined,
      category,
      groups: tags,
      photo: photoUrl || undefined,
    };

    await createContact(contactData).unwrap();
    Alert.alert('Success', 'Contact created successfully');
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setIsLoading(true);
            // TODO: Implement delete mutation
            Alert.alert('Success', 'Contact deleted successfully');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error?.message || 'Failed to delete contact');
          } finally {
            setIsLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleEditTags = () => {
    // TODO: Navigate to tag management interface
    Alert.alert('Tag Management', 'Tag editing interface coming soon');
  };

  // Form validation: button should be disabled if form is not ready
  // Form is valid when: name is provided AND (has image OR has hint)
  const isFormValid = () => {
    const hasName = name.trim().length > 0;
    const hasImage = photoUri !== null;
    const hasHint = hint.trim().length > 0;

    return hasName && (hasImage || hasHint);
  };

  return (
    <View style={styles.container}>
      {/* Details Step */}
      {step === 'details' && (
        <ScrollView style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{isEditing ? 'Edit' : 'Add'} Contact</Text>

          {/* Image Selector */}
          <View style={styles.formGroup}>
            <ImageSelector
              imageUri={photoUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </View>

          {/* Name Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Contact name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.semantic.textTertiary}
            />
          </View>

          {/* Hint Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hint</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., tall, red jacket"
              value={hint}
              onChangeText={setHint}
              placeholderTextColor={colors.semantic.textTertiary}
            />
          </View>

          {/* Summary Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Summary</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="Notes about this person"
              value={summary}
              onChangeText={setSummary}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.semantic.textTertiary}
            />
          </View>

          {/* Category Selection */}
          <View style={styles.formGroup}>
            <CategorySelector
              categories={CATEGORIES}
              selectedValue={category}
              onSelect={setCategory}
              label="Category"
              required
            />
          </View>

          {/* Tags */}
          <View style={styles.formGroup}>
            <TagSelector
              availableTags={AVAILABLE_TAGS}
              selectedTags={tags}
              onTagsChange={setTags}
              onEditTags={handleEditTags}
            />
          </View>

          {/* Form Action Buttons */}
          <FormButtons
            primaryButton={{
              label: `${isEditing ? 'Save' : 'Add'} Contact`,
              icon: 'save',
              onPress: handleSave,
              isLoading: isLoading,
              disabled: !isFormValid(),
            }}
            deleteButton={
              isEditing
                ? {
                    label: '',
                    icon: 'trash',
                    onPress: handleDelete,
                  }
                : undefined
            }
            cancelButton={{
              label: 'Cancel',
              onPress: () => navigation.goBack(),
            }}
          />
        </ScrollView>
      )}

      {/* Face Detection Step */}
      {step === 'faceDetection' && (
        <View style={styles.stepContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size={48} color={colors.primary[500]} />
            <Text style={styles.loadingLabel}>Scanning for Faces</Text>
            <Text style={styles.loadingSubtext}>
              Analyzing your photo...
            </Text>
          </View>
        </View>
      )}

      {/* Face Selection Step */}
      {step === 'faceSelection' && detectedFaces.length > 0 && (
        <View style={styles.stepContainer}>
          <FaceSelector
            faces={detectedFaces}
            onSelectFace={handleFaceSelected}
            onCropInstead={handleCropManually}
            isLoading={isLoading}
          />
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep('details')}
          >
            <Text style={styles.secondaryButtonText}>← Back to Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Crop Step */}
      {step === 'crop' && uploadedImageUri && (
        <Cropper
          imageUri={uploadedImageUri}
          onCropConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
          style={styles.stepContainer}
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
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.body.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.semantic.error,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.semantic.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.large.fontSize,
    color: colors.semantic.text,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  secondaryButton: {
    backgroundColor: colors.semantic.surface,
    borderWidth: 1,
    borderColor: colors.semantic.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.semantic.text,
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
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
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  placeholderLabel: {
    fontSize: typography.title.medium.fontSize,
    fontWeight: '600',
    color: colors.semantic.text,
  },
  placeholderSubtext: {
    fontSize: typography.body.medium.fontSize,
    color: colors.semantic.textSecondary,
  },
});
