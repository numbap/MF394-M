import type { NamedFace } from '../../components/BulkNamer';

export type PartyStep = 'upload' | 'detecting' | 'naming' | 'category' | 'crop';
export type PartyViewMode = 'category' | 'tagManagement';

export interface CardData {
  uploadedImageUri: string | null;
  detectedFaces: Array<{ id: string; uri: string }>;
  namedFaces: NamedFace[];
  category: string;
  tags: string[];
}

export interface CardStatus {
  isSaving: boolean;
  saveError: string | null;
}

export interface PartyModeCardHandlers {
  onImageSelected: (uri: string) => void;
  onImageDeleted: () => void;
  onCropConfirm: (uri: string) => void;
  onCropCancel: () => void;
  onNamesChange: (faces: NamedFace[]) => void;
  onContinueToCategory: () => void;
  onBackToUpload: () => void;
  onBackToNaming: () => void;
  onCategoryChange: (cat: string) => void;
  onTagsChange: (tags: string[]) => void;
  onEditTags: () => void;
  onExitTagManagement: () => void;
  onSave: () => void;
  onBack: () => void;
  onErrorBack: () => void;
}

export interface PartyModeCardProps {
  step: PartyStep;
  viewMode: PartyViewMode;
  data: CardData;
  status: CardStatus;
  handlers: PartyModeCardHandlers;
}
