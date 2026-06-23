import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { colors, spacing, radii } from '../../theme/theme';
import { ImageSelector } from '../../components/ImageSelector';
import { BulkNamer } from '../../components/BulkNamer';
import { CategoryTagsStep } from '../../components/CategoryTagsStep';
import { FormButtons } from '../../components/FormButtons';
import { FormGroup } from '../../components/FormGroup';
import { LoadingState } from '../../components/LoadingState';
import { InfoBox } from '../../components/InfoBox';
import { Cropper } from '../../components/Cropper';
import { FullScreenSpinner } from '../../components/FullScreenSpinner';
import { TagManagementView } from '../../components/TagManagementView';
import { CATEGORIES } from '../../constants';
import type { PartyModeCardProps } from './partyModeCard.types';

export type { PartyStep, PartyViewMode, PartyModeCardHandlers, PartyModeCardProps, CardData, CardStatus } from './partyModeCard.types';

export function PartyModeCard({
  step,
  viewMode,
  data,
  status,
  handlers,
}: PartyModeCardProps) {
  const { uploadedImageUri, detectedFaces, namedFaces, category, tags } = data;
  const { isSaving, saveError } = status;

  return (
    <View style={styles.container}>
      {step === 'upload' && (
        <ScrollView style={styles.stepContainer}>
          <FormGroup>
            <ImageSelector
              imageUri={uploadedImageUri}
              onImageSelected={handlers.onImageSelected}
              onImageDeleted={handlers.onImageDeleted}
            />
          </FormGroup>

          <FormGroup>
            <InfoBox text="Upload a photo with multiple faces. We'll detect each person and let you name them.">
              <View style={styles.multifaceImageWrapper}>
                <Image
                  source={require('../../../assets/multiface.png')}
                  style={styles.multifaceImage}
                  resizeMode="contain"
                />
              </View>
            </InfoBox>
          </FormGroup>

          <FormButtons
            cancelButton={{
              label: 'Back',
              icon: 'arrow-left',
              onPress: handlers.onBack,
            }}
          />
        </ScrollView>
      )}

      {step === 'detecting' && (
        <View style={styles.stepContainer}>
          <LoadingState title="Detecting Faces" subtitle="Analyzing your photo..." />
        </View>
      )}

      {step === 'naming' && detectedFaces.length > 0 && (
        <ScrollView style={styles.namingStepContainer}>
          <BulkNamer
            faces={detectedFaces}
            onNamesChange={handlers.onNamesChange}
            initialNames={namedFaces}
            style={styles.bulkNamerContent}
          />

          <View style={styles.buttonFooter}>
            <FormButtons
              primaryButton={{
                label: `Continue (${namedFaces.length})`,
                icon: 'arrow-right',
                onPress: handlers.onContinueToCategory,
                disabled: !namedFaces.length,
              }}
              cancelButton={{
                label: 'Back to Upload',
                icon: 'arrow-left',
                onPress: handlers.onBackToUpload,
              }}
            />
          </View>
        </ScrollView>
      )}

      {step === 'category' && (
        <>
          {viewMode === 'category' && (
            <CategoryTagsStep
              contactCount={namedFaces.length}
              category={category}
              tags={tags}
              categories={CATEGORIES}
              contacts={namedFaces.map((face) => ({
                id: face.id,
                name: face.name,
              }))}
              onCategoryChange={handlers.onCategoryChange}
              onTagsChange={handlers.onTagsChange}
              onEditTags={handlers.onEditTags}
              onSave={handlers.onSave}
              onBack={handlers.onBackToNaming}
              isSaving={isSaving}
            />
          )}

          {viewMode === 'tagManagement' && (
            <TagManagementView onExit={handlers.onExitTagManagement} />
          )}
        </>
      )}

      {step === 'crop' && uploadedImageUri && (
        <Cropper
          imageUri={uploadedImageUri}
          onCropConfirm={handlers.onCropConfirm}
          onCancel={handlers.onCropCancel}
          style={styles.stepContainer}
        />
      )}

      <FullScreenSpinner
        visible={isSaving && !saveError}
        variant="loading"
        message={`Saving ${namedFaces.length} contact${namedFaces.length !== 1 ? 's' : ''}...`}
      />

      <FullScreenSpinner
        visible={!!saveError}
        variant="error"
        errorMessage={saveError || ''}
        onBack={handlers.onErrorBack}
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
  namingStepContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'column',
    backgroundColor: colors.semantic.background,
  },
  bulkNamerContent: {
    flex: 1,
  },
  multifaceImageWrapper: {
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: -spacing.xs,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  multifaceImage: {
    width: 200,
    height: 200,
  },
  buttonFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.semantic.background,
    borderTopWidth: 1,
    borderTopColor: colors.semantic.border,
  },
});
