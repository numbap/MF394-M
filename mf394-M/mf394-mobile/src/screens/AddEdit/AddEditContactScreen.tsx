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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useCreateContactMutation } from '../../store/api/contacts.api';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { CategorySelector, Category } from '../../components/CategorySelector';
import { TagSelector } from '../../components/TagSelector';
import { FaceSelector, Face } from '../../components/FaceSelector';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import * as imageService from '../../services/imageService';

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
      const faces = await detectFaces(uri);
      if (faces && faces.length > 0) {
        setDetectedFaces(faces);
        setSelectedFaceIndex(0);
        setStep('faceSelection');
      } else {
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
      if (!uploadedImageUri) {
        throw new Error('No image uploaded');
      }

      // Step 1: Crop the selected face
      const croppedImageUri = await cropFace(uploadedImageUri, faceIndex);

      // Step 2: Compress the cropped image
      const compressedImageUri = await imageService.compressImage(croppedImageUri);

      // Step 3: Upload to S3 and get URL
      const s3Url = await imageService.uploadImage(compressedImageUri, {
        type: 'contact-photo',
      });

      // Step 4: Set the S3 URL as the photo
      setPhotoUri(s3Url);

      // Step 5: Return to details screen
      setStep('details');
      Alert.alert('Success', 'Photo processed and uploaded');
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

  const handleImageDeleted = () => {
    setPhotoUri(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      setIsLoading(true);
      const contactData = {
        name: name.trim(),
        hint: hint.trim() || undefined,
        summary: summary.trim() || undefined,
        category,
        groups: tags,
        photo: photoUri || undefined,
      };

      // TODO: Implement photo upload to S3
      // For now, just create contact without photo

      await createContact(contactData).unwrap();
      Alert.alert('Success', 'Contact created successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to save contact');
    } finally {
      setIsLoading(false);
    }
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

          {/* Button Groups with spacing */}
          <View style={styles.buttonGroupSpaced}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Save/Add Button */}
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <FontAwesome
                      name="save"
                      size={18}
                      color="#fff"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.saveButtonText}>
                      {isEditing ? 'Save' : 'Add'} Contact
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Delete Button (Edit Only) */}
              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isLoading}
                >
                  <FontAwesome name="trash" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Face Detection Step */}
      {step === 'faceDetection' && (
        <View style={styles.stepContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
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

      {/* Crop Step - Placeholder */}
      {step === 'crop' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Crop Photo</Text>
          <View style={styles.placeholderContainer}>
            <FontAwesome
              name="crop"
              size={64}
              color={colors.semantic.textSecondary}
            />
            <Text style={styles.placeholderLabel}>Crop Editor</Text>
            <Text style={styles.placeholderSubtext}>
              Photo cropping coming soon
            </Text>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setStep('details')}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  buttonGroupSpaced: {
    flexDirection: 'column',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: typography.body.large.fontSize,
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
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent[500],
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.body.large.fontSize,
  },
  deleteButton: {
    backgroundColor: colors.semantic.error,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: spacing.sm,
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
