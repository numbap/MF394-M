import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ImageSelector } from '../../src/components/ImageSelector';
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

describe('ImageSelector', () => {
  const mockOnImageSelected = jest.fn();
  const mockOnImageDeleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload prompt when no image is provided', () => {
      const { getByText } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      expect(getByText('Add Photo')).toBeTruthy();
      expect(getByText('Tap to upload')).toBeTruthy();
    });

    it('should render custom placeholder when provided', () => {
      const { getByText } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
          placeholder={<Text>Custom Upload Text</Text>}
        />
      );

      expect(getByText('Custom Upload Text')).toBeTruthy();
    });

    it('should render image when imageUri is provided', () => {
      const testUri = 'file:///test/image.jpg';
      const { getByTestId } = render(
        <ImageSelector
          imageUri={testUri}
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const image = getByTestId('selected-image');
      expect(image).toBeTruthy();
      expect(image.props.source).toEqual({ uri: testUri });
    });

    it('should match snapshot with no image', () => {
      const { toJSON } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });

    it('should match snapshot with image', () => {
      const { toJSON } = render(
        <ImageSelector
          imageUri="file:///test/image.jpg"
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Image Selection', () => {
    it('should open image picker when tapped', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent.press(container);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          aspect: [1, 1],
          quality: 1,
        });
      });
    });

    it('should call onImageSelected when image is picked', async () => {
      const testUri = 'file:///new/image.jpg';
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: testUri }],
      });

      const { getByTestId } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent.press(container);

      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(testUri);
      });
    });

    it('should not call onImageSelected when picker is canceled', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: true,
      });

      const { getByTestId } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent.press(container);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });

    it('should not call onImageSelected when no assets are returned', async () => {
      ImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [],
      });

      const { getByTestId } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent.press(container);

      await waitFor(() => {
        expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });

      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });
  });

  describe('Image Deletion', () => {
    it('should call onImageDeleted when long-pressed with image', () => {
      const { getByTestId } = render(
        <ImageSelector
          imageUri="file:///test/image.jpg"
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent(container, 'longPress');

      expect(mockOnImageDeleted).toHaveBeenCalledTimes(1);
    });

    it('should not call onImageDeleted when long-pressed without image', () => {
      const { getByTestId } = render(
        <ImageSelector
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent(container, 'longPress');

      expect(mockOnImageDeleted).not.toHaveBeenCalled();
    });

    it('should not call onImageDeleted when imageUri is null', () => {
      const { getByTestId } = render(
        <ImageSelector
          imageUri={null}
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const container = getByTestId('image-selector-container');
      fireEvent(container, 'longPress');

      expect(mockOnImageDeleted).not.toHaveBeenCalled();
    });
  });


  describe('Image Properties', () => {
    it('should render image with correct resizeMode', () => {
      const { getByTestId } = render(
        <ImageSelector
          imageUri="file:///test/image.jpg"
          onImageSelected={mockOnImageSelected}
          onImageDeleted={mockOnImageDeleted}
        />
      );

      const image = getByTestId('selected-image');
      expect(image.props.resizeMode).toBe('cover');
    });
  });
});
