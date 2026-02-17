/**
 * AddEditContactScreen Tests
 *
 * Tests for the Add/Edit contact workflow including:
 * - Image selection and upload
 * - Face detection
 * - Manual cropping
 * - Form validation
 * - Contact creation via RTK Query mutations
 * - Navigation only after successful save
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AddEditContactScreen from './AddEditContactScreen';
import authReducer from '../../store/slices/auth.slice';
import uiReducer from '../../store/slices/ui.slice';
import filtersReducer from '../../store/slices/filters.slice';
import tagsReducer from '../../store/slices/tags.slice';
import contactsReducer from '../../store/slices/contacts.slice';

// RTK Query mutation mocks
const mockCreateContact = jest.fn();
const mockUpdateContact = jest.fn();
const mockDeleteContact = jest.fn();
const mockUploadImage = jest.fn();

jest.mock('../../store/api/contacts.api', () => ({
  useGetUserQuery: () => ({ data: { contacts: [] }, isLoading: false }),
  useCreateContactMutation: () => [mockCreateContact, { isLoading: false }],
  useUpdateContactMutation: () => [mockUpdateContact, { isLoading: false }],
  useDeleteContactMutation: () => [mockDeleteContact, { isLoading: false }],
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
  useRoute: () => ({
    params: {},
  }),
}));

// Mock face detection hook
const mockDetectFaces = jest.fn();
jest.mock('../../hooks/useFaceDetection', () => ({
  useFaceDetection: () => ({
    detectFaces: mockDetectFaces,
    cropFace: jest.fn(),
    faces: [],
  }),
}));

// Mock image cropping utilities
jest.mock('../../utils/imageCropping', () => ({
  cropFaceWithBounds: jest.fn((imageUri) =>
    Promise.resolve(`cropped-${imageUri}`)
  ),
}));

// Mock components
jest.mock('../../components/ImageSelector', () => ({
  ImageSelector: ({ onImageSelected }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity
        testID="image-selector"
        onPress={() => onImageSelected('mock-image-uri')}
      >
        <Text>Upload Image</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../components/CategoryTagSelector', () => ({
  CategoryTagSelector: ({ onEditTags }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="category-tag-selector">
        <Text>Category and Tags</Text>
        {onEditTags && (
          <TouchableOpacity testID="edit-tags-button" onPress={onEditTags}>
            <Text>Edit Tags</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
}));

jest.mock('../../components/FaceSelector', () => ({
  FaceSelector: ({ onSelectFace, onCropInstead }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        <TouchableOpacity testID="select-face-0" onPress={() => onSelectFace(0)}>
          <Text>Face 1</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="crop-instead" onPress={onCropInstead}>
          <Text>Crop Manually</Text>
        </TouchableOpacity>
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
          onPress={() => onCropConfirm('data:image/jpeg;base64,croppedImage')}
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

jest.mock('../../components/FormButtons', () => ({
  FormButtons: ({ primaryButton, cancelButton, deleteButton }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        {primaryButton && (
          <TouchableOpacity
            testID="primary-button"
            onPress={primaryButton.onPress}
            disabled={primaryButton.isLoading || primaryButton.disabled}
          >
            <Text>{primaryButton.label}</Text>
          </TouchableOpacity>
        )}
        {deleteButton && (
          <TouchableOpacity testID="delete-button" onPress={deleteButton.onPress}>
            <Text>{deleteButton.label || 'Delete'}</Text>
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

jest.mock('../../components/TagManagementView', () => ({
  TagManagementView: ({ onExit }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="tag-management-view">
        <Text>Tag Management View</Text>
        <TouchableOpacity testID="exit-tag-management" onPress={onExit}>
          <Text>Back to Form</Text>
        </TouchableOpacity>
      </View>
    );
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

jest.mock('../../components/Toast', () => ({
  Toast: () => null,
}));

jest.mock('../../components/FormGroup', () => ({
  FormGroup: ({ children }: any) => children,
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

describe('AddEditContactScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    // Default: mutations succeed
    mockCreateContact.mockResolvedValue({ data: { _id: '123' } });
    mockUpdateContact.mockResolvedValue({ data: { _id: '123' } });
    mockDeleteContact.mockResolvedValue({ data: {} });
    mockUploadImage.mockResolvedValue({ data: { url: 'https://s3.example.com/photo.jpg' } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the details form on initial load', () => {
      const { getByPlaceholderText, getByText } = renderWithProvider(<AddEditContactScreen />);
      expect(getByPlaceholderText('Contact name')).toBeTruthy();
      expect(getByText('Upload Image')).toBeTruthy();
    });

    it('shows all form fields', () => {
      const { getByPlaceholderText, getByTestId } = renderWithProvider(<AddEditContactScreen />);
      expect(getByPlaceholderText('Contact name')).toBeTruthy();
      expect(getByPlaceholderText('e.g., tall, red jacket')).toBeTruthy();
      expect(getByPlaceholderText('Notes about this person')).toBeTruthy();
      expect(getByTestId('category-tag-selector')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('prevents saving when form is invalid (no name)', async () => {
      const { getByTestId } = renderWithProvider(<AddEditContactScreen />);
      const saveButton = getByTestId('primary-button');
      fireEvent.press(saveButton);
      await waitFor(() => {
        expect(mockCreateContact).not.toHaveBeenCalled();
      });
    });

    it('navigates after successful create with name and hint', async () => {
      const { getByTestId, getByPlaceholderText } = renderWithProvider(<AddEditContactScreen />);

      fireEvent.changeText(getByPlaceholderText('Contact name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('e.g., tall, red jacket'), 'tall guy');

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('Listing', expect.any(Object));
      });
    });

    it('does NOT navigate if createContact fails', async () => {
      mockCreateContact.mockResolvedValue({ error: { message: 'Server error' } });

      const { getByTestId, getByPlaceholderText } = renderWithProvider(<AddEditContactScreen />);

      fireEvent.changeText(getByPlaceholderText('Contact name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('e.g., tall, red jacket'), 'tall guy');

      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('does NOT navigate if uploadImage fails', async () => {
      mockUploadImage.mockResolvedValue({ error: { message: 'Upload failed' } });
      mockDetectFaces.mockResolvedValue({ faces: [], isRealDetection: true });

      const { getByTestId, getByPlaceholderText } = renderWithProvider(<AddEditContactScreen />);

      fireEvent.changeText(getByPlaceholderText('Contact name'), 'John Doe');
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(getByTestId('crop-confirm')).toBeTruthy());
      fireEvent.press(getByTestId('crop-confirm'));

      await waitFor(() => expect(getByPlaceholderText('Contact name')).toBeTruthy());
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockUploadImage).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Image Upload Flow - No Faces Detected', () => {
    it('navigates to crop screen when no faces detected', async () => {
      mockDetectFaces.mockResolvedValue({ faces: [], isRealDetection: true });

      const { getByTestId, getByText } = renderWithProvider(<AddEditContactScreen />);
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(mockDetectFaces).toHaveBeenCalledWith('mock-image-uri'));
      await waitFor(() => expect(getByText('Crop')).toBeTruthy());
    });

    it('returns to details after crop confirm', async () => {
      mockDetectFaces.mockResolvedValue({ faces: [], isRealDetection: true });

      const { getByTestId, getByText, getByPlaceholderText } = renderWithProvider(
        <AddEditContactScreen />
      );

      fireEvent.press(getByTestId('image-selector'));
      await waitFor(() => expect(getByText('Crop')).toBeTruthy());

      fireEvent.press(getByTestId('crop-confirm'));
      await waitFor(() => expect(getByPlaceholderText('Contact name')).toBeTruthy());
    });
  });

  describe('Image Upload Flow - Faces Detected', () => {
    it('shows face selector when faces are detected', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: '1',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
            uri: 'face-1-uri',
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = renderWithProvider(<AddEditContactScreen />);
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => expect(getByText('Face 1')).toBeTruthy());
    });
  });

  describe('Tag Management', () => {
    it('switches to tag management view when edit tags is pressed', () => {
      const { getByTestId } = renderWithProvider(<AddEditContactScreen />);
      fireEvent.press(getByTestId('edit-tags-button'));
      expect(getByTestId('tag-management-view')).toBeTruthy();
    });

    it('returns to details when exiting tag management', () => {
      const { getByTestId, getByPlaceholderText } = renderWithProvider(<AddEditContactScreen />);
      fireEvent.press(getByTestId('edit-tags-button'));
      fireEvent.press(getByTestId('exit-tag-management'));
      expect(getByPlaceholderText('Contact name')).toBeTruthy();
    });
  });

  describe('Cancel', () => {
    it('calls navigation.goBack when cancel is pressed', () => {
      const { getByTestId } = renderWithProvider(<AddEditContactScreen />);
      fireEvent.press(getByTestId('cancel-button'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});
