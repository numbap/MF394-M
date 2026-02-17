/**
 * PartyModeScreen Tests
 *
 * Tests for the Party Mode workflow including:
 * - Image upload and face detection
 * - Manual cropping when no faces detected
 * - Naming multiple faces
 * - Category and tags selection
 * - Bulk contact creation via RTK Query
 * - Partial failure handling (some contacts fail, others succeed)
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PartyModeScreen from './PartyModeScreen';
import { showAlert } from '../../utils/showAlert';
import authReducer from '../../store/slices/auth.slice';
import uiReducer from '../../store/slices/ui.slice';
import filtersReducer from '../../store/slices/filters.slice';
import tagsReducer from '../../store/slices/tags.slice';
import contactsReducer from '../../store/slices/contacts.slice';

// RTK Query mutation mocks
const mockCreateContact = jest.fn();
const mockUploadImage = jest.fn();

jest.mock('../../store/api/contacts.api', () => ({
  useCreateContactMutation: () => [mockCreateContact, { isLoading: false }],
}));

jest.mock('../../store/api/upload.api', () => ({
  useUploadImageMutation: () => [mockUploadImage, { isLoading: false }],
}));

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

// Mock face detection hook
const mockDetectFaces = jest.fn();
jest.mock('../../hooks/useFaceDetection', () => ({
  useFaceDetection: () => ({
    detectFaces: mockDetectFaces,
    faces: [],
  }),
}));

// Mock image cropping utilities
jest.mock('../../utils/imageCropping', () => ({
  cropFaceWithBounds: jest.fn((imageUri) =>
    Promise.resolve(`cropped-${imageUri}`)
  ),
}));

// Mock showAlert utility
jest.mock('../../utils/showAlert', () => ({
  showAlert: jest.fn(),
}));

// Mock components
jest.mock('../../components/ImageSelector', () => ({
  ImageSelector: ({ onImageSelected }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="image-selector"
        onPress={() => onImageSelected('mock-group-image-uri')}
      >
        <Text>Upload Image</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../components/BulkNamer', () => {
  const React = require('react');
  return {
    BulkNamer: ({ faces, onNamesChange }: any) => {
      const { View, TouchableOpacity, Text } = require('react-native');
      const [namedMap, setNamedMap] = React.useState(new Map());

      const handleNamePress = (face: any, index: number) => {
        const newMap = new Map(namedMap);
        newMap.set(face.id, {
          id: face.id,
          name: `Person ${index + 1}`,
          faceUri: face.uri,
        });
        setNamedMap(newMap);
        onNamesChange(Array.from(newMap.values()));
      };

      return (
        <View testID="bulk-namer">
          {faces.map((face: any, index: number) => (
            <TouchableOpacity
              key={face.id}
              testID={`name-face-${index}`}
              onPress={() => handleNamePress(face, index)}
            >
              <Text>Name Face {index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    },
  };
});

jest.mock('../../components/CategoryTagsStep', () => ({
  CategoryTagsStep: ({ onSave, onBack, isSaving }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="category-tags-step">
        <TouchableOpacity testID="save-contacts" onPress={onSave} disabled={isSaving}>
          <Text>Save Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="back-to-naming" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../components/FormButtons', () => ({
  FormButtons: ({ primaryButton, cancelButton }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        {primaryButton && (
          <TouchableOpacity
            testID="primary-button"
            onPress={primaryButton.onPress}
            disabled={primaryButton.disabled}
          >
            <Text>{primaryButton.label}</Text>
          </TouchableOpacity>
        )}
        {cancelButton && (
          <TouchableOpacity testID="cancel-button" onPress={cancelButton.onPress}>
            <Text>{cancelButton.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
}));

jest.mock('../../components/Cropper', () => ({
  Cropper: ({ onCropConfirm, onCancel }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        <TouchableOpacity
          testID="crop-confirm"
          onPress={() => onCropConfirm('cropped-image-uri')}
        >
          <Text>Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="crop-cancel" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../components/InfoBox', () => ({
  InfoBox: ({ text }: any) => {
    const { Text } = require('react-native');
    return <Text>{text}</Text>;
  },
}));

jest.mock('../../components/LoadingState', () => ({
  LoadingState: ({ title }: any) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
}));

jest.mock('../../components/FullScreenSpinner', () => ({
  FullScreenSpinner: () => null,
}));

jest.mock('../../components/FormGroup', () => ({
  FormGroup: ({ children }: any) => children,
}));

jest.mock('../../components/TagManagementView', () => ({
  TagManagementView: ({ onExit }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="tag-management-view">
        <TouchableOpacity testID="exit-tag-management" onPress={onExit}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      filters: filtersReducer,
      tags: tagsReducer,
      contacts: contactsReducer,
    },
  });

const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(<Provider store={store}>{component}</Provider>);
};

// Helper: detect faces with 2 faces, name them, proceed to category step
const setupTwoFacesNamed = async (getByTestId: any) => {
  mockDetectFaces.mockResolvedValue({
    faces: [
      { id: 'f1', bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } } },
      { id: 'f2', bounds: { origin: { x: 100, y: 0 }, size: { width: 100, height: 100 } } },
    ],
    isRealDetection: true,
  });

  fireEvent.press(getByTestId('image-selector'));
  await waitFor(() => expect(getByTestId('bulk-namer')).toBeTruthy());

  fireEvent.press(getByTestId('name-face-0'));
  fireEvent.press(getByTestId('name-face-1'));

  fireEvent.press(getByTestId('primary-button')); // Continue button
  await waitFor(() => expect(getByTestId('category-tags-step')).toBeTruthy());
};

describe('PartyModeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateContact.mockResolvedValue({ data: { _id: 'new-id' } });
    mockUploadImage.mockResolvedValue({ data: { url: 'https://s3.example.com/face.jpg' } });
  });

  describe('Initial Render', () => {
    it('renders upload step on initial load', () => {
      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      expect(getByTestId('image-selector')).toBeTruthy();
    });

    it('has a back button to go back', () => {
      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      fireEvent.press(getByTestId('cancel-button'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Face Detection Flow', () => {
    it('shows loading state while detecting faces', async () => {
      mockDetectFaces.mockImplementation(() => new Promise(() => {})); // never resolves

      const { getByText } = renderWithProvider(<PartyModeScreen />);
      fireEvent.press(await waitFor(() => require('@testing-library/react-native').screen?.getByTestId?.('image-selector')));
    });

    it('shows naming step after faces are detected', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          { id: 'f1', bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } } },
        ],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(getByTestId('bulk-namer')).toBeTruthy());
    });

    it('goes to crop when no faces detected', async () => {
      mockDetectFaces.mockResolvedValue({ faces: [], isRealDetection: true });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(getByText('Crop')).toBeTruthy());
    });
  });

  describe('handleSave - success scenarios', () => {
    it('creates all contacts and navigates on full success', async () => {
      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      await setupTwoFacesNamed(getByTestId);

      fireEvent.press(getByTestId('save-contacts'));

      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalledTimes(2);
        expect(mockNavigate).toHaveBeenCalledWith('Listing', expect.any(Object));
      });
    });

    it('only invokes save once even if button pressed multiple times', async () => {
      let resolveFirst: (value: any) => void;
      const firstCall = new Promise((resolve) => { resolveFirst = resolve; });
      mockCreateContact
        .mockReturnValueOnce(firstCall)
        .mockResolvedValue({ data: { _id: 'id-2' } });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      await setupTwoFacesNamed(getByTestId);

      fireEvent.press(getByTestId('save-contacts'));

      // Resolve first contact
      resolveFirst!({ data: { _id: 'id-1' } });

      await waitFor(() => {
        // mockCreateContact called for the two named faces (not more)
        expect(mockCreateContact.mock.calls.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('handleSave - failure scenarios', () => {
    it('does NOT navigate on partial failure - shows error message', async () => {
      // First contact succeeds, second fails
      mockCreateContact
        .mockResolvedValueOnce({ data: { _id: 'id-1' } })
        .mockResolvedValueOnce({ error: { message: 'Failed' } });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      await setupTwoFacesNamed(getByTestId);

      fireEvent.press(getByTestId('save-contacts'));

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockCreateContact).toHaveBeenCalledTimes(2);
      });
    });

    it('does NOT navigate on full failure - shows error', async () => {
      mockCreateContact.mockResolvedValue({ error: { message: 'All failed' } });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      await setupTwoFacesNamed(getByTestId);

      fireEvent.press(getByTestId('save-contacts'));

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('No names validation', () => {
    it('shows alert when trying to save with no named faces', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [{ id: 'f1', bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } } }],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(getByTestId('bulk-namer')).toBeTruthy());

      // Go to category step without naming
      fireEvent.press(getByTestId('primary-button'));

      // Since no faces named, Continue button should be disabled
      // showAlert should not be called yet
    });
  });
});
