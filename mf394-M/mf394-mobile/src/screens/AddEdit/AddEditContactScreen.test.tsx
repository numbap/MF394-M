/**
 * AddEditContactScreen Tests
 *
 * Tests for the Add/Edit contact workflow including:
 * - Image selection and upload
 * - Face detection
 * - Manual cropping
 * - Form validation
 * - Contact creation
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddEditContactScreen from './AddEditContactScreen';
import { imageService } from '../../services/imageService';

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

// Mock Redux hooks
const mockCreateContact = jest.fn();
jest.mock('../../store/api/contacts.api', () => ({
  useCreateContactMutation: () => [mockCreateContact],
}));

// Mock face detection hook
const mockDetectFaces = jest.fn();
const mockCropFace = jest.fn();
jest.mock('../../hooks/useFaceDetection', () => ({
  useFaceDetection: () => ({
    detectFaces: mockDetectFaces,
    cropFace: mockCropFace,
    faces: [],
  }),
}));

// Mock image service
jest.mock('../../services/imageService', () => ({
  imageService: {
    uploadImage: jest.fn(),
  },
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

jest.mock('../../components/CategorySelector', () => ({
  CategorySelector: ({ onSelect }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="category-selector" onPress={() => onSelect('work')}>
        <Text>Select Category</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../components/TagSelector', () => ({
  TagSelector: () => {
    const { Text } = require('react-native');
    return <Text>Tag Selector</Text>;
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
  FormButtons: ({ primaryButton, cancelButton }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View>
        {primaryButton && (
          <TouchableOpacity
            testID="primary-button"
            onPress={primaryButton.onPress}
            disabled={primaryButton.isLoading}
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

describe('AddEditContactScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockCreateContact.mockReturnValue({
      unwrap: jest.fn().mockResolvedValue({ id: '123' }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders the details form on initial load', () => {
      const { getAllByText, getByPlaceholderText, getByText } = render(<AddEditContactScreen />);

      // "Add Contact" appears twice - in title and button
      expect(getAllByText('Add Contact').length).toBe(2);
      expect(getByPlaceholderText('Contact name')).toBeTruthy();
      expect(getByText('Upload Image')).toBeTruthy();
    });

    it('shows all form fields', () => {
      const { getByPlaceholderText, getByText } = render(<AddEditContactScreen />);

      expect(getByPlaceholderText('Contact name')).toBeTruthy();
      expect(getByPlaceholderText('e.g., tall, red jacket')).toBeTruthy();
      expect(getByPlaceholderText('Notes about this person')).toBeTruthy();
      expect(getByText('Select Category')).toBeTruthy();
      expect(getByText('Tag Selector')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('prevents saving when form is invalid (no name)', async () => {
      const { getByTestId } = render(<AddEditContactScreen />);

      const saveButton = getByTestId('primary-button');

      // Try to press the button (should be disabled)
      fireEvent.press(saveButton);

      // Should not have called the mutation because form is invalid
      await waitFor(() => {
        expect(mockCreateContact).not.toHaveBeenCalled();
      });
    });

    it('prevents saving when there is name but no image and no hint', async () => {
      const { getByTestId, getByPlaceholderText } = render(<AddEditContactScreen />);

      const nameInput = getByPlaceholderText('Contact name');
      fireEvent.changeText(nameInput, 'John Doe');

      const saveButton = getByTestId('primary-button');

      // Try to press the button (should be disabled)
      fireEvent.press(saveButton);

      // Should not have called the mutation because form is invalid (no image and no hint)
      await waitFor(() => {
        expect(mockCreateContact).not.toHaveBeenCalled();
      });
    });

    it('allows saving when name and hint are provided', async () => {
      const { getByTestId, getByPlaceholderText } = render(<AddEditContactScreen />);

      const nameInput = getByPlaceholderText('Contact name');
      const hintInput = getByPlaceholderText('e.g., tall, red jacket');

      fireEvent.changeText(nameInput, 'John Doe');
      fireEvent.changeText(hintInput, 'tall guy');

      const saveButton = getByTestId('primary-button');
      fireEvent.press(saveButton);

      // Should have called the mutation because form is valid
      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            hint: 'tall guy',
            category: 'friends-family',
          })
        );
      });
    });

    it('allows saving when name and image are provided', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(<AddEditContactScreen />);

      // Add name
      const nameInput = getByPlaceholderText('Contact name');
      fireEvent.changeText(nameInput, 'John Doe');

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Wait for cropper and confirm
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-confirm'));

      // Wait for return to details
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });

      const saveButton = getByTestId('primary-button');
      fireEvent.press(saveButton);

      // Should have called the mutation because form is valid
      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalled();
      });
    });

    it('allows saving with only name and image (no hint)', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByPlaceholderText, getByTestId } = render(
        <AddEditContactScreen />
      );

      const nameInput = getByPlaceholderText('Contact name');
      fireEvent.changeText(nameInput, 'John Doe');

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Wait for cropper and confirm
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-confirm'));

      // Wait for return to details
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });

      const saveButton = getByTestId('primary-button');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockCreateContact).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'John Doe',
            category: 'friends-family',
          })
        );
      });
    });
  });

  describe('Image Upload Flow - No Faces Detected', () => {
    it('navigates to crop screen when no faces detected', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByText } = render(<AddEditContactScreen />);

      // Upload image
      const imageSelector = getByTestId('image-selector');
      fireEvent.press(imageSelector);

      // Wait for face detection to complete
      await waitFor(() => {
        expect(mockDetectFaces).toHaveBeenCalledWith('mock-image-uri');
      });

      // Should show cropper
      await waitFor(() => {
        expect(getByText('Crop')).toBeTruthy();
      });
    });

    it('stores cropped image locally and returns to details', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload and trigger cropping
      fireEvent.press(getByTestId('image-selector'));

      await waitFor(() => {
        expect(getByText('Crop')).toBeTruthy();
      });

      // Confirm crop
      const cropButton = getByTestId('crop-confirm');
      fireEvent.press(cropButton);

      // Should return to details screen
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
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

      const { getByTestId, getByText } = render(<AddEditContactScreen />);

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Wait for face selector
      await waitFor(() => {
        expect(getByText('Face 1')).toBeTruthy();
      });
    });

    it('stores selected face and returns to details', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [
          {
            id: '1',
            bounds: { origin: { x: 0, y: 0 }, size: { width: 100, height: 100 } },
            uri: 'data:image/jpeg;base64,faceImage',
          },
        ],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Select face
      await waitFor(() => {
        expect(getByTestId('select-face-0')).toBeTruthy();
      });
      fireEvent.press(getByTestId('select-face-0'));

      // Should return to details screen
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
    });

    it('allows manual cropping from face selector', async () => {
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

      const { getByTestId, getByText } = render(<AddEditContactScreen />);

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Click "Crop Manually"
      await waitFor(() => {
        expect(getByTestId('crop-instead')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-instead'));

      // Should show cropper
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
    });
  });

  describe('Save Contact with Photo', () => {
    beforeEach(() => {
      process.env.AUTH_MOCK = 'false';
      (imageService.uploadImage as jest.Mock).mockResolvedValue(
        'https://s3.amazonaws.com/uploaded-photo.jpg'
      );
    });

    it('uploads photo before saving in production mode', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload and crop image
      fireEvent.press(getByTestId('image-selector'));
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-confirm'));

      // Fill in name
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
      const nameInput = getByPlaceholderText('Contact name');
      fireEvent.changeText(nameInput, 'Jane Doe');

      // Save
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(imageService.uploadImage).toHaveBeenCalledWith(
          expect.stringContaining('data:image/jpeg;base64'),
          { type: 'contact-photo' }
        );
        expect(mockCreateContact).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Doe',
            photo: 'https://s3.amazonaws.com/uploaded-photo.jpg',
          })
        );
      });
    });

    it('skips upload in mock mode', async () => {
      process.env.AUTH_MOCK = 'true';
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload and crop image
      fireEvent.press(getByTestId('image-selector'));
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-confirm'));

      // Fill in name
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
      fireEvent.changeText(getByPlaceholderText('Contact name'), 'Jane Doe');

      // Save
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(imageService.uploadImage).not.toHaveBeenCalled();
        expect(mockCreateContact).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Jane Doe',
            photo: expect.stringContaining('data:image/jpeg;base64'),
          })
        );
      });
    });

    it('handles upload failure gracefully', async () => {
      process.env.AUTH_MOCK = 'false';
      (imageService.uploadImage as jest.Mock).mockRejectedValue(
        new Error('Upload failed')
      );
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload and crop image
      fireEvent.press(getByTestId('image-selector'));
      await waitFor(() => {
        expect(getByTestId('crop-confirm')).toBeTruthy();
      });
      fireEvent.press(getByTestId('crop-confirm'));

      // Fill in name
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
      fireEvent.changeText(getByPlaceholderText('Contact name'), 'Jane Doe');

      // Save
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Upload Error',
          expect.stringContaining('Failed to upload photo'),
          expect.any(Array)
        );
      });
    });
  });

  describe('Navigation', () => {
    it('goes back when cancel button is pressed', () => {
      const { getByTestId } = render(<AddEditContactScreen />);

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('goes back after successful save', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <AddEditContactScreen />
      );

      // Provide name and hint to make form valid
      fireEvent.changeText(getByPlaceholderText('Contact name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('e.g., tall, red jacket'), 'tall guy');
      fireEvent.press(getByTestId('primary-button'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('Crop Cancellation', () => {
    it('returns to details when crop is cancelled', async () => {
      mockDetectFaces.mockResolvedValue({
        faces: [],
        isRealDetection: true,
      });

      const { getByTestId, getByPlaceholderText } = render(
        <AddEditContactScreen />
      );

      // Upload image
      fireEvent.press(getByTestId('image-selector'));

      // Wait for cropper
      await waitFor(() => {
        expect(getByTestId('crop-cancel')).toBeTruthy();
      });

      // Cancel crop
      fireEvent.press(getByTestId('crop-cancel'));

      // Should return to details
      await waitFor(() => {
        expect(getByPlaceholderText('Contact name')).toBeTruthy();
      });
    });
  });

  describe('Snapshot', () => {
    it('matches snapshot for initial render', () => {
      const tree = render(<AddEditContactScreen />);
      expect(tree).toMatchSnapshot();
    });
  });
});
