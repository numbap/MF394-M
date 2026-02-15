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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { showAlert } from '../../utils/showAlert';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import { addContact, updateContact, deleteContact } from '../../store/slices/contacts.slice';
import { Contact } from '../../store/api/contacts.api';
import { RootState } from '../../store';
import { colors, spacing, radii, typography } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { CategoryTagSelector } from '../../components/CategoryTagSelector';
import { FaceSelector, Face } from '../../components/FaceSelector';
import { Cropper } from '../../components/Cropper';
import { FormButtons } from '../../components/FormButtons';
import { FormGroup } from '../../components/FormGroup';
import { LoadingState } from '../../components/LoadingState';
import { Toast } from '../../components/Toast';
import { FullScreenSpinner } from '../../components/FullScreenSpinner';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { imageService } from '../../services/imageService';
import { CATEGORIES, DEFAULT_CATEGORY, AVAILABLE_TAGS } from '../../constants';
import { AUTH_MOCK } from '../../utils/constants';
import { cropFaceWithBounds } from '../../utils/imageCropping';

type Step = 'details' | 'faceDetection' | 'faceSelection' | 'crop';

export default function AddEditContactScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [step, setStep] = useState<Step>('details');
  const [isLoading, setIsLoading] = useState(false);

  // Get contactId from route params for edit mode
  const contactId = (route.params as any)?.contactId;
  const isEditing = !!contactId;

  // Get existing contact from Redux if editing
  const contacts = useSelector((state: RootState) => state.contacts.data);
  const existingContact = isEditing
    ? contacts.find((c) => c._id === contactId)
    : null;

  // Form state
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Image processing state
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Face[]>([]);
  const [selectedFaceIndex, setSelectedFaceIndex] = useState<number>(0);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'info'>('success');

  // Save state
  const [saveError, setSaveError] = useState<string | null>(null);

  const { detectFaces, cropFace, faces: detectionFaces } = useFaceDetection();

  // Pre-populate form if editing
  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name);
      setHint(existingContact.hint || '');
      setSummary(existingContact.summary || '');
      setCategory(existingContact.category);
      setTags(existingContact.groups || []);
      setPhotoUri(existingContact.photo || null);
    }
  }, [existingContact]);

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
      showAlert('Error', 'Failed to process image. Please try again.');
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
      showAlert(
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
      showAlert(
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
        showAlert('Error', 'Please enter a name');
      } else {
        showAlert('Error', 'Please provide either a photo or a hint');
      }
      return;
    }

    try {
      setIsLoading(true);
      setSaveError(null);

      // Upload image if present and not in mock mode
      let uploadedPhotoUrl: string | null | undefined = photoUri;

      console.log('[AddEditContactScreen] AUTH_MOCK:', AUTH_MOCK, 'photoUri:', photoUri?.substring(0, 50));

      if (photoUri && !photoUri.startsWith('http') && !AUTH_MOCK) {
        console.log('[AddEditContactScreen] Uploading to S3...');
        // Local image in production mode - upload to S3
        uploadedPhotoUrl = await imageService.uploadImage(photoUri, {
          type: 'contact-photo',
          source: isEditing ? 'edit-contact' : 'add-contact',
        });
      } else {
        console.log('[AddEditContactScreen] Skipping upload (mock mode or already uploaded)');
      }
      // In mock mode, use local URI directly

      await saveContactData(uploadedPhotoUrl);
    } catch (error: any) {
      console.error('Save failed:', error);
      setSaveError(error?.message || 'Failed to save contact');
    }
  };

  const saveContactData = async (photoUrl: string | null | undefined) => {
    const now = Date.now();

    if (isEditing && existingContact) {
      // Update existing contact
      const updatedContact: Contact = {
        ...existingContact,
        name: name.trim(),
        hint: hint.trim() || undefined,
        summary: summary.trim() || undefined,
        category: category as Contact['category'],
        groups: tags,
        photo: photoUrl || undefined,
        edited: now,
      };

      dispatch(updateContact(updatedContact));
    } else {
      // Create new contact
      const newContact: Contact = {
        _id: `contact_${now}_${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        hint: hint.trim() || undefined,
        summary: summary.trim() || undefined,
        category: category as Contact['category'],
        groups: tags,
        photo: photoUrl || undefined,
        created: now,
        edited: now,
      };

      dispatch(addContact(newContact));
    }

    // Success! Navigate to listing with filters applied
    setIsLoading(false);
    navigation.navigate('Listing', {
      category,
      tags,
    });
  };

  const handleErrorBack = () => {
    setSaveError(null);
    setIsLoading(false);
  };

  const handleDelete = () => {
    if (!isEditing || !contactId) return;

    showAlert('Delete Contact', 'Are you sure you want to delete this contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setIsLoading(true);

            dispatch(deleteContact(contactId));

            // Show success toast
            setToastMessage('Contact deleted successfully');
            setToastVariant('success');
            setShowToast(true);

            // Navigate back after short delay
            setTimeout(() => {
              navigation.goBack();
            }, 500);
          } catch (error: any) {
            setToastMessage(error?.message || 'Failed to delete contact');
            setToastVariant('error');
            setShowToast(true);
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
    showAlert('Tag Management', 'Tag editing interface coming soon');
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
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          variant={toastVariant}
          visible={showToast}
          onDismiss={() => setShowToast(false)}
        />
      )}

      {/* Details Step */}
      {step === 'details' && (
        <ScrollView style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{isEditing ? 'Edit' : 'Add'} Contact</Text>

          {/* Image Selector */}
          <FormGroup>
            <ImageSelector
              imageUri={photoUri}
              onImageSelected={handleImageSelected}
              onImageDeleted={handleImageDeleted}
            />
          </FormGroup>

          {/* Name Input */}
          <FormGroup>
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
          </FormGroup>

          {/* Hint Input */}
          <FormGroup>
            <Text style={styles.label}>Hint</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., tall, red jacket"
              value={hint}
              onChangeText={setHint}
              placeholderTextColor={colors.semantic.textTertiary}
            />
          </FormGroup>

          {/* Summary Input */}
          <FormGroup>
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
          </FormGroup>

          {/* Category and Tags Selection */}
          <FormGroup>
            <CategoryTagSelector
              categories={CATEGORIES}
              selectedCategory={category}
              onCategoryChange={setCategory}
              availableTags={AVAILABLE_TAGS}
              selectedTags={tags}
              onTagsChange={setTags}
              onEditTags={handleEditTags}
            />
          </FormGroup>

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
          <LoadingState
            title="Scanning for Faces"
            subtitle="Analyzing your photo..."
          />
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

      {/* Full-Screen Spinner */}
      <FullScreenSpinner
        visible={isLoading && !saveError}
        variant="loading"
        message={isEditing ? 'Updating contact...' : 'Adding contact...'}
      />

      {/* Error State */}
      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ''}
        onBack={handleErrorBack}
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
    backgroundColor: colors.semantic.inputBackground,
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
