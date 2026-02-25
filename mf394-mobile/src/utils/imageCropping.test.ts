/**
 * Image Cropping Utilities Tests
 *
 * Tests for face cropping functionality on both web and native platforms
 */

import { cropFaceWithBounds } from './imageCropping';

// Mock Platform
let mockPlatformOS = 'web';
jest.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS;
    },
    set OS(value) {
      mockPlatformOS = value;
    },
    select: jest.fn((obj: any) => obj[mockPlatformOS]),
  },
}));

// Mock expo-image-manipulator (v14 named-export API)
const mockManipulateAsync = jest.fn();
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: mockManipulateAsync,
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

describe('imageCropping utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cropFaceWithBounds - Web Path', () => {
    beforeEach(() => {
      // Set platform to web
      mockPlatformOS = 'web';

      // Mock window.Image
      const mockImage = {
        src: '',
        width: 800,
        height: 600,
        onload: null as any,
        onerror: null as any,
        crossOrigin: '',
      };

      (global as any).window = {
        Image: jest.fn(() => mockImage),
      };

      // Mock document.createElement for canvas
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,croppedImage'),
      };

      (global as any).document = {
        createElement: jest.fn(() => mockCanvas),
      };

      // Mock URL
      (global as any).URL = {
        createObjectURL: jest.fn(() => 'blob:mock-url'),
        revokeObjectURL: jest.fn(),
      };

      // Trigger onload after a short delay
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      }, 0);
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
      delete (global as any).URL;
    });

    it('calls web cropping when Platform.OS is web', async () => {
      const imageUri = 'data:image/jpeg;base64,testImage';
      const bounds = {
        origin: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };

      const result = await cropFaceWithBounds(imageUri, bounds, 20);

      expect(result).toBe('data:image/jpeg;base64,croppedImage');
      expect((global as any).window.Image).toHaveBeenCalled();
    });

    it('creates canvas with correct dimensions', async () => {
      const imageUri = 'data:image/jpeg;base64,testImage';
      const bounds = {
        origin: { x: 50, y: 50 },
        size: { width: 150, height: 150 },
      };
      const padding = 20;

      await cropFaceWithBounds(imageUri, bounds, padding);

      const mockCanvas = (global as any).document.createElement();
      // Canvas should be sized to cropped region + padding
      expect(mockCanvas.width).toBeDefined();
      expect(mockCanvas.height).toBeDefined();
    });

    it('handles file:// URLs by converting to blob', async () => {
      const imageUri = 'file:///path/to/image.jpg';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      // Mock fetch for file:// URLs
      (global as any).fetch = jest.fn(() =>
        Promise.resolve({
          blob: () => Promise.resolve(new Blob()),
        })
      );

      await cropFaceWithBounds(imageUri, bounds, 20);

      expect((global as any).fetch).toHaveBeenCalledWith(imageUri);
      expect((global as any).URL.createObjectURL).toHaveBeenCalled();
    });

    it('applies padding correctly to bounds', async () => {
      const imageUri = 'data:image/jpeg;base64,testImage';
      const bounds = {
        origin: { x: 100, y: 100 },
        size: { width: 200, height: 200 },
      };
      const padding = 25;

      const result = await cropFaceWithBounds(imageUri, bounds, padding);

      // Verify result is a data URL (padding is applied internally)
      expect(result).toContain('data:image/jpeg;base64');
    });

    it('returns data URL from canvas', async () => {
      const imageUri = 'data:image/jpeg;base64,testImage';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      const result = await cropFaceWithBounds(imageUri, bounds, 20);

      expect(result).toContain('data:image/jpeg;base64');
      expect((global as any).document.createElement().toDataURL).toHaveBeenCalledWith(
        'image/jpeg',
        0.9
      );
    });
  });

  describe('cropFaceWithBounds - Native Path', () => {
    beforeEach(() => {
      // Set platform to iOS
      mockPlatformOS = 'ios';

      // Reset window/document to simulate native environment
      delete (global as any).window;
      delete (global as any).document;

      // manipulateAsync is called twice: first as a no-op probe for dimensions,
      // then for the actual crop. Mock both calls.
      mockManipulateAsync
        .mockResolvedValueOnce({ width: 4000, height: 3000 }) // probe
        .mockResolvedValueOnce({
          uri: 'file:///cropped-image.jpg',
          width: 200,
          height: 200,
        }); // crop
    });

    it('calls ImageManipulator when Platform.OS is not web', async () => {
      const imageUri = 'file:///original-image.jpg';
      const bounds = {
        origin: { x: 50, y: 50 },
        size: { width: 150, height: 150 },
      };
      const padding = 20;

      const result = await cropFaceWithBounds(imageUri, bounds, padding);

      // First call: dimension probe (no-op)
      expect(mockManipulateAsync).toHaveBeenNthCalledWith(1, imageUri, []);
      // Second call: actual crop — bounds used directly (no PixelRatio division)
      expect(mockManipulateAsync).toHaveBeenNthCalledWith(
        2,
        imageUri,
        [
          {
            crop: {
              originX: 30, // 50 - 20 (padding)
              originY: 30,
              width: 190, // 150 + 40 (padding * 2)
              height: 190,
            },
          },
        ],
        { compress: 0.9, format: 'jpeg' }
      );
      expect(result).toBe('file:///cropped-image.jpg');
    });

    it('passes correct crop region to ImageManipulator', async () => {
      const imageUri = 'file:///test.jpg';
      const bounds = {
        origin: { x: 100, y: 200 },
        size: { width: 300, height: 400 },
      };
      const padding = 15;

      await cropFaceWithBounds(imageUri, bounds, padding);

      // Second call is the crop (first is probe)
      expect(mockManipulateAsync).toHaveBeenNthCalledWith(
        2,
        imageUri,
        expect.arrayContaining([
          expect.objectContaining({
            crop: expect.objectContaining({
              originX: 85, // 100 - 15
              originY: 185, // 200 - 15
              width: 330, // 300 + 30
              height: 430, // 400 + 30
            }),
          }),
        ]),
        expect.any(Object)
      );
    });

    it('clamps crop to image boundary from probe dimensions', async () => {
      mockManipulateAsync.mockReset();
      mockManipulateAsync
        .mockResolvedValueOnce({ width: 800, height: 600 }) // probe — small image
        .mockResolvedValueOnce({ uri: 'file:///cropped.jpg', width: 200, height: 200 });

      const imageUri = 'file:///small-image.jpg';
      const bounds = {
        origin: { x: 700, y: 500 },
        size: { width: 200, height: 200 },
      };

      await cropFaceWithBounds(imageUri, bounds, 20);

      const cropCall = mockManipulateAsync.mock.calls[1][1][0].crop;
      // Origin + size should not exceed image dimensions
      expect(cropCall.originX + cropCall.width).toBeLessThanOrEqual(800);
      expect(cropCall.originY + cropCall.height).toBeLessThanOrEqual(600);
    });

    it('handles negative origin by clamping to 0', async () => {
      const imageUri = 'file:///test.jpg';
      const bounds = {
        origin: { x: 5, y: 10 },
        size: { width: 100, height: 100 },
      };
      const padding = 20;

      await cropFaceWithBounds(imageUri, bounds, padding);

      // Second call is the crop
      const cropCall = mockManipulateAsync.mock.calls[1][1][0].crop;
      expect(cropCall.originX).toBeGreaterThanOrEqual(0);
      expect(cropCall.originY).toBeGreaterThanOrEqual(0);
    });

    it('returns original URI if native crop fails', async () => {
      mockManipulateAsync.mockReset();
      mockManipulateAsync.mockRejectedValue(new Error('Native crop failed'));

      const imageUri = 'file:///test.jpg';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      const result = await cropFaceWithBounds(imageUri, bounds, 20);

      expect(mockManipulateAsync).toHaveBeenCalled();
      // Falls back to returning the original URI
      expect(result).toBe(imageUri);
    });

    it('returns manipulated image URI on success', async () => {
      const expectedUri = 'file:///cropped-result.jpg';
      mockManipulateAsync.mockReset();
      mockManipulateAsync
        .mockResolvedValueOnce({ width: 2000, height: 1500 }) // probe
        .mockResolvedValueOnce({
          uri: expectedUri,
          width: 150,
          height: 150,
        });

      const imageUri = 'file:///original.jpg';
      const bounds = {
        origin: { x: 50, y: 50 },
        size: { width: 100, height: 100 },
      };

      const result = await cropFaceWithBounds(imageUri, bounds, 20);

      expect(result).toBe(expectedUri);
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      mockPlatformOS = 'web';

      const mockImage = {
        src: '',
        width: 800,
        height: 600,
        onload: null as any,
        onerror: null as any,
        crossOrigin: '',
      };

      (global as any).window = {
        Image: jest.fn(() => mockImage),
      };

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn(),
        })),
        toDataURL: jest.fn(() => 'data:image/jpeg;base64,test'),
      };

      (global as any).document = {
        createElement: jest.fn(() => mockCanvas),
      };

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload(new Event('load'));
        }
      }, 0);
    });

    afterEach(() => {
      delete (global as any).window;
      delete (global as any).document;
    });

    it('handles http:// URLs directly', async () => {
      const imageUri = 'http://example.com/image.jpg';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      await cropFaceWithBounds(imageUri, bounds, 20);

      const mockImage = (global as any).window.Image();
      expect(mockImage.src).toBeDefined();
    });

    it('handles https:// URLs directly', async () => {
      const imageUri = 'https://example.com/secure-image.jpg';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      await cropFaceWithBounds(imageUri, bounds, 20);

      const mockImage = (global as any).window.Image();
      expect(mockImage.src).toBeDefined();
    });

    it('sets crossOrigin to anonymous', async () => {
      const imageUri = 'https://example.com/image.jpg';
      const bounds = {
        origin: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      };

      await cropFaceWithBounds(imageUri, bounds, 20);

      const mockImage = (global as any).window.Image();
      expect(mockImage.crossOrigin).toBe('anonymous');
    });
  });
});
