import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateId } from '../../utils/generateId';
import { showAlert } from '../../utils/showAlert';
import { usePartyProcessing } from '../../hooks/usePartyProcessing';
import { useBulkCreateContactsMutation } from '../../store/api/contacts.api';
import type { ContactInput } from '../../store/api/contacts.api';
import { useUploadImageMutation } from '../../store/api/upload.api';
import { DEFAULT_CATEGORY } from '../../constants';
import { PartyModeCard } from './PartyModeCard';
import type { PartyStep, PartyViewMode, PartyModeCardHandlers } from './PartyModeCard';
import type { NamedFace } from '../../components/BulkNamer';

export default function PartyModeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [step, setStep] = useState<PartyStep>('upload');
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  const [detectedFaces, setDetectedFaces] = useState<Array<{ id: string; uri: string }>>([]);
  const [namedFaces, setNamedFaces] = useState<NamedFace[]>([]);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [tags, setTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<PartyViewMode>('category');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sharedImageUri = (route.params as any)?.sharedImageUri as string | undefined;

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step !== 'crop' });
  }, [step, navigation]);

  useEffect(() => {
    if (sharedImageUri) {
      navigation.setParams({ sharedImageUri: undefined } as any);
      handleImageSelected(sharedImageUri);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const params = (route.params as any);
      if (!params?.sharedImageUri && step !== 'upload') {
        setStep('upload');
        setUploadedImageUri(null);
        setDetectedFaces([]);
        setNamedFaces([]);
        setCategory(DEFAULT_CATEGORY);
        setTags([]);
        setViewMode('category');
      }
    });
    return unsubscribe;
  }, [navigation, route.params, step]);

  const { process: processImage } = usePartyProcessing();
  const [bulkCreateContacts] = useBulkCreateContactsMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleImageSelected = async (uri: string) => {
    setUploadedImageUri(uri);
    setStep('detecting');

    try {
      const { detectedFaces: processedFaces, prePopulatedNames } = await processImage(uri);

      if (processedFaces.length === 0) {
        setStep('crop');
        return;
      }

      setDetectedFaces(processedFaces);

      if (prePopulatedNames.length > 0) setNamedFaces(prePopulatedNames);
      setStep('naming');
    } catch (error: any) {
      console.error('[PartyMode] Error during image processing:', error);
      showAlert('Error', 'Failed to process image. Please try again.');
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
    const singleFace = { id: generateId(), uri: croppedImageUri };
    setDetectedFaces([singleFace]);
    setStep('naming');
  };

  const handleCropCancel = () => {
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

    const errors: string[] = [];
    const contactInputs: ContactInput[] = [];
    for (const namedFace of namedFaces) {
      try {
        const uploadResult = await uploadImage({
          uri: namedFace.faceUri,
          type: 'contact-photo',
          source: 'party-mode',
        });
        if ('error' in uploadResult) throw new Error('Upload failed');
        const photoUrl = uploadResult.data?.url || '';
        contactInputs.push({
          name: namedFace.name.trim(),
          category: category as any,
          groups: tags,
          photo: photoUrl,
        });
      } catch (error) {
        errors.push(namedFace.name);
        console.error(`Failed to upload photo for "${namedFace.name}":`, error);
      }
    }

    if (contactInputs.length > 0) {
      try {
        const bulkResult = await bulkCreateContacts(contactInputs);
        if ('error' in bulkResult) throw new Error('Bulk create failed');
      } catch (error) {
        errors.push(...contactInputs.map((c) => c.name));
        console.error('Failed to bulk create contacts:', error);
      }
    }

    setIsSaving(false);

    if (errors.length === 0 && contactInputs.length > 0) {
      navigation.navigate('Listing' as never, { category, tags } as never);
    } else if (contactInputs.length > 0 && errors.length > 0) {
      setSaveError(`Some contacts saved. Failed: ${errors.join(', ')}. Tap Save to retry.`);
    } else {
      setSaveError('Failed to save contacts. Please check your connection and try again.');
    }
  };

  const handlers: PartyModeCardHandlers = {
    onImageSelected: handleImageSelected,
    onImageDeleted: handleImageDeleted,
    onCropConfirm: handleCropConfirm,
    onCropCancel: handleCropCancel,
    onNamesChange: setNamedFaces,
    onContinueToCategory: () => setStep('category'),
    onBackToUpload: () => {
      setStep('upload');
      setUploadedImageUri(null);
      setDetectedFaces([]);
      setNamedFaces([]);
    },
    onBackToNaming: () => setStep('naming'),
    onCategoryChange: setCategory,
    onTagsChange: setTags,
    onEditTags: () => setViewMode('tagManagement'),
    onExitTagManagement: () => setViewMode('category'),
    onSave: handleSave,
    onBack: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Listing' as never);
      }
    },
    onErrorBack: () => {
      setSaveError(null);
      setIsSaving(false);
    },
  };

  return (
    <PartyModeCard
      step={step}
      viewMode={viewMode}
      uploadedImageUri={uploadedImageUri}
      detectedFaces={detectedFaces}
      namedFaces={namedFaces}
      category={category}
      tags={tags}
      isSaving={isSaving}
      saveError={saveError}
      handlers={handlers}
    />
  );
}
