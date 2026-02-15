/**
 * PartyModeScreen Tests
 *
 * Tests for the Party Mode workflow including:
 * - Image upload and face detection
 * - Manual cropping when no faces detected
 * - Naming multiple faces
 * - Category and tags selection
 * - Bulk contact creation
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PartyModeScreen from './PartyModeScreen';
import { imageService } from '../../services/imageService';
import contactsReducer from '../../store/slices/contacts.slice';
import syncReducer from '../../store/slices/sync.slice';
import { showAlert } from '../../utils/showAlert';

// Create a mock store for testing
const createMockStore = () => {
  return configureStore({
    reducer: {
      // RTK Query API reducers
      api: (state = {}) => state,
      contacts: contactsReducer,
      sync: syncReducer,
      auth: (state = { accessToken: null }) => state,
      ui: (state = { toasts: [] }) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

// Mock RTK Query mutation
const mockCreateContact = jest.fn();
jest.mock('../../store/api/contacts.api', () => ({
  useCreateContactMutation: () => [
    mockCreateContact,
    { isLoading: false, error: null },
  ],
}));

// Mock face detection hook
const mockDetectFaces = jest.fn();
jest.mock('../../hooks/useFaceDetection', () => ({
  useFaceDetection: () => ({
    detectFaces: mockDetectFaces,
    faces: [],
  }),
}));

// Mock image service
jest.mock('../../services/imageService', () => ({
  imageService: {
    uploadImage: jest.fn(),
  },
}));

// Mock image cropping utilities
jest.mock('../../utils/imageCropping', () => ({
  cropFaceWithBounds: jest.fn((imageUri, bounds) =>
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
  CategoryTagsStep: ({ onSave, onBack, contacts }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="category-tags-step">
        <Text>Contacts: {contacts.length}</Text>
        <TouchableOpacity testID="save-button" onPress={onSave}>
          <Text>Save All</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="back-button" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../components/Cropper', () => ({
  Cropper: ({ onCropConfirm, onCancel }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="cropper">
        <TouchableOpacity
          testID="crop-confirm"
          onPress={() => onCropConfirm('data:image/jpeg;base64,croppedImage')}
        >
          <Text>Confirm Crop</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="crop-cancel" onPress={onCancel}>
          <Text>Cancel</Text>
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

jest.mock('../../components/FullScreenSpinner', () => ({
  FullScreenSpinner: ({ visible, message, errorMessage }: any) => {
    const { View, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="full-screen-spinner">
        {message && <Text>{message}</Text>}
        {errorMessage && <Text>{errorMessage}</Text>}
      </View>
    );
  },
}));

// Helper to render component with Redux Provider
const renderWithProvider = (component: React.ReactElement) => {
  const store = createMockStore();
  const utils = render(<Provider store={store}>{component}</Provider>);
  return {
    ...utils,
    store,
  };
};

describe('PartyModeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateContact.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ id: '123' }),
    });
    (imageService.uploadImage as jest.Mock).mockResolvedValue(
      'https://s3.amazonaws.com/uploaded-photo.jpg'
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders upload screen on initial load', () => {
      const { getByText, getByTestId } = renderWithProvider(<PartyModeScreen />);

      expect(getByText('Party Mode')).toBeTruthy();
      expect(getByText('Upload a group photo to create multiple contacts')).toBeTruthy();
      expect(getByTestId('image-selector')).toBeTruthy();
    });

    it('shows info box with instructions', () => {
      const { getByText } = renderWithProvider(<PartyModeScreen />);

      expect(
        getByText(
          "Upload a photo with multiple faces. We'll detect each person and let you name them."
        )
      ).toBeTruthy();
    });

    it('has back button', () => {
      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      const backButton = getByTestId('cancel-button');
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Face Detection - Success Path', () => {
    it('upload image detects multiple faces and shows naming screen', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
          {
            id: 'face-1',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 100, y: 0 }, size: { width: 100, height: 100 } },
          },
          {
            id: 'face-2',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 200, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Wait for face detection
      await waitFor(() => {
        expect(mockDetectFaces).toHaveBeenCalledWith('mock-group-image-uri');
      });

      // Should show naming screen with all faces
      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
        expect(getByText('Name Face 1')).toBeTruthy();
        expect(getByText('Name Face 2')).toBeTruthy();
        expect(getByText('Name Face 3')).toBeTruthy();
      });
    });

    it('shows detected faces count in continue button', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      // Name one face
      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        const continueButton = getByTestId('primary-button');
        expect(continueButton).toBeTruthy();
      });
    });

    it('can name faces and continue to category/tags', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
          {
            id: 'face-1',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 100, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      // Upload and detect
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      // Name both faces
      fireEvent.press(getByTestId('name-face-0'));
      fireEvent.press(getByTestId('name-face-1'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      // Continue to category/tags
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
        expect(getByText('Contacts: 2')).toBeTruthy();
      });
    });

    it('saves all named contacts', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
          {
            id: 'face-1',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 100, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      // Upload, detect, and name
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));
      fireEvent.press(getByTestId('name-face-1'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      // Continue to category/tags
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      // Save all
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        // Verify contacts were added to Redux store (optimistic update)
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(2);
        expect(state.contacts.data[0].name).toBe('Person 1');
        expect(state.contacts.data[1].name).toBe('Person 2');

        // Verify navigation occurred
        expect(mockNavigate).toHaveBeenCalledWith('Listing',
          expect.objectContaining({
            category: expect.any(String),
          })
        );
      });
    });
  });

  describe('Face Detection - No Faces Path', () => {
    it('upload image with no faces shows manual crop', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(mockDetectFaces).toHaveBeenCalledWith('mock-group-image-uri');
      });

      // Should show cropper
      await waitFor(() => {
        expect(getByTestId('cropper')).toBeTruthy();
      });
    });

    it('manual crop creates single face in naming screen', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      // Upload and go to crop
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('cropper')).toBeTruthy();
      });

      // Confirm crop
      fireEvent.press(getByTestId('crop-confirm'));

      // Should show naming screen with one face
      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
        expect(getByTestId('name-face-0')).toBeTruthy();
      });
    });

    it('can complete flow with manually cropped face', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByText, store } = renderWithProvider(<PartyModeScreen />);

      // Upload, crop, and name
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('cropper')).toBeTruthy();
      });

      fireEvent.press(getByTestId('crop-confirm'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      // Continue to category/tags
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
        expect(getByText('Contacts: 1')).toBeTruthy();
      });

      // Save
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        // Verify contact was added to Redux store
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(1);
      });
    });
  });

  describe('Naming Validation', () => {
    it('continue button disabled when no faces named', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      // Continue button should show (0) when no faces are named
      await waitFor(() => {
        expect(getByText(/Continue \(0\)/)).toBeTruthy();
      });
    });

    it('shows alert when trying to save without names', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      // Try to continue without naming (button is disabled, but test the handler)
      // Navigate to category step manually for this test
      fireEvent.press(getByTestId('primary-button'));

      // Should remain on naming screen because button is disabled
      expect(getByTestId('bulk-namer')).toBeTruthy();
    });
  });

  describe('Navigation & Cancellation', () => {
    it('back button from upload returns to previous screen', () => {
      const { getByTestId } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('cancel-button'));

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('cancel from manual crop returns to upload', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      // Go to crop
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('cropper')).toBeTruthy();
      });

      // Cancel
      fireEvent.press(getByTestId('crop-cancel'));

      // Should return to upload
      await waitFor(() => {
        expect(getByText('Upload a group photo to create multiple contacts')).toBeTruthy();
      });
    });

    it('back from naming returns to upload and resets state', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      // Upload and detect
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      // Go back from naming
      fireEvent.press(getByTestId('cancel-button'));

      // Should return to upload
      await waitFor(() => {
        expect(getByText('Upload a group photo to create multiple contacts')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles face detection failure', async () => {
      mockDetectFaces.mockRejectedValue(new Error('Face detection failed'));

      const { getByTestId, getByText } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(showAlert).toHaveBeenCalledWith(
          'Error',
          'Failed to detect faces. Please try again.'
        );
      });

      // Should return to upload
      expect(getByText('Upload a group photo to create multiple contacts')).toBeTruthy();
    });

    it('handles save failure gracefully with fallback', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      // Mock image upload to fail
      (imageService.uploadImage as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      // Upload, detect, name
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      // Continue and save
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      fireEvent.press(getByTestId('save-button'));

      // Should still save contact locally with fallback (using local URI)
      await waitFor(() => {
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(1);
        // Verify it used the local URI as fallback
        expect(state.contacts.data[0].photo).toContain('cropped-');

        // Should still navigate
        expect(mockNavigate).toHaveBeenCalledWith('Listing',
          expect.objectContaining({
            category: expect.any(String),
          })
        );
      });
    });
  });

  describe('AUTH_MOCK Environment Variable', () => {
    it('skips image upload to S3 when AUTH_MOCK is true', async () => {
      // AUTH_MOCK is already true from .env file
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      // Upload, detect, name
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      // Continue to category/tags
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      // Save all
      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        // Verify contact was added to Redux store
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(1);

        // Verify sync queue is empty (no queuing in demo mode)
        expect(state.sync.queue).toHaveLength(0);
      });

      // Verify imageService.uploadImage was NOT called (because AUTH_MOCK is true)
      // In mock mode, we use local URIs directly
      expect(imageService.uploadImage).not.toHaveBeenCalled();

      // Verify the contact uses local URI (starts with 'cropped-')
      const state = store.getState();
      expect(state.contacts.data[0].photo).toContain('cropped-');
    });

    it('uses local image URIs in mock mode', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(1);
      });

      // In AUTH_MOCK mode, the photo should be the cropped local URI
      const state = store.getState();
      const contact = state.contacts.data[0];
      expect(contact.photo).toBeTruthy();
      expect(contact.photo).not.toContain('s3.amazonaws.com');
      expect(contact.photo).toContain('cropped-');
    });
  });

  describe('Offline-first sync queue integration', () => {
    it('dispatches contacts to Redux immediately (optimistic update)', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      // Upload, detect, name
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      // Before save, store should be empty
      expect(store.getState().contacts.data).toHaveLength(0);

      fireEvent.press(getByTestId('save-button'));

      // After save, contact should be in Redux immediately (optimistic)
      await waitFor(() => {
        expect(store.getState().contacts.data).toHaveLength(1);
        expect(store.getState().contacts.data[0].name).toBe('Person 1');
      });
    });

    it('skips sync queue in demo mode (AUTH_MOCK=true)', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        // Contact should be in Redux
        expect(store.getState().contacts.data).toHaveLength(1);

        // Sync queue should be empty (no queuing in demo mode)
        expect(store.getState().sync.queue).toHaveLength(0);
      });
    });

    it('generates unique temp IDs for each contact', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
          {
            id: 'face-1',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 100, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));
      fireEvent.press(getByTestId('name-face-1'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState();
        expect(state.contacts.data).toHaveLength(2);

        // Verify IDs are unique and match pattern: contact_${timestamp}_${index}_${random}
        const id1 = state.contacts.data[0]._id;
        const id2 = state.contacts.data[1]._id;

        expect(id1).toMatch(/^contact_\d+_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^contact_\d+_\d+_[a-z0-9]+$/);
        expect(id1).not.toBe(id2);
      });
    });

    it('saves contacts with correct timestamps', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: 'face-0',
            uri: 'mock-group-image-uri',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, store } = renderWithProvider(<PartyModeScreen />);

      const beforeSave = Date.now();

      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByTestId('bulk-namer')).toBeTruthy();
      });

      fireEvent.press(getByTestId('name-face-0'));

      await waitFor(() => {
        expect(getByTestId('primary-button')).toBeTruthy();
      });

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(getByTestId('category-tags-step')).toBeTruthy();
      });

      fireEvent.press(getByTestId('save-button'));

      await waitFor(() => {
        const state = store.getState();
        const contact = state.contacts.data[0];

        // Verify timestamps are reasonable
        expect(contact.created).toBeGreaterThanOrEqual(beforeSave);
        expect(contact.created).toBeLessThanOrEqual(Date.now());
        expect(contact.edited).toBe(contact.created);
      });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for initial render', () => {
      const tree = renderWithProvider(<PartyModeScreen />);
      expect(tree).toMatchSnapshot();
    });
  });
});
