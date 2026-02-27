/**
 * Image Cropping Utilities
 *
 * Shared utilities for cropping face regions from images.
 * Works on both web (canvas-based) and native (ImageManipulator) platforms.
 */

import { Platform } from 'react-native';

export type FaceBounds = {
  origin: { x: number; y: number };
  size: { width: number; height: number };
};

/**
 * Crop a face using bounds directly (for display)
 * This avoids relying on hook state which may not be updated yet
 */
export async function cropFaceWithBounds(
  imageUri: string,
  bounds: FaceBounds,
  padding?: number
): Promise<string> {
  // Default to 50% of the larger face dimension so the crop always shows
  // comfortable context around the face regardless of image resolution.
  // The old fixed 20px was negligible on high-res photos (e.g. 5% of a 400px face).
  const effectivePadding = padding ?? Math.round(
    Math.max(bounds.size.width, bounds.size.height) * 0.5
  );

  if (Platform.OS === 'web') {
    return await cropFaceWebWithBounds(imageUri, bounds, effectivePadding);
  } else {
    try {
      const { manipulateAsync, SaveFormat } = require('expo-image-manipulator');

      // Use a no-op manipulateAsync call to get post-EXIF dimensions.
      // Image.getSize on Android returns raw file dimensions ignoring EXIF rotation,
      // but manipulateAsync applies EXIF — so this gives us the true oriented size.
      const probe = await manipulateAsync(imageUri, []);
      const imgW = probe.width;
      const imgH = probe.height;

      // expo-face-detector (ML Kit) returns bounds in image-pixel coordinates —
      // the same space that manipulateAsync uses. No PixelRatio conversion needed.
      const originX = Math.max(0, Math.round(bounds.origin.x - effectivePadding));
      const originY = Math.max(0, Math.round(bounds.origin.y - effectivePadding));
      const cropWidth = Math.min(
        Math.round(bounds.size.width + effectivePadding * 2),
        imgW - originX,
      );
      const cropHeight = Math.min(
        Math.round(bounds.size.height + effectivePadding * 2),
        imgH - originY,
      );

      const result = await manipulateAsync(
        imageUri,
        [{ crop: { originX, originY, width: Math.max(1, cropWidth), height: Math.max(1, cropHeight) } }],
        { compress: 0.9, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (err) {
      console.error('Native crop failed:', err);
      // DOM canvas APIs are not available on Android native — return original URI as fallback.
      return imageUri;
    }
  }
}

/**
 * Web-specific face cropping using canvas
 */
async function cropFaceWebWithBounds(
  imageUri: string,
  bounds: FaceBounds,
  padding: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      let uriToLoad = imageUri;

      if (imageUri.startsWith('file://')) {
        fetch(imageUri)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            loadAndCropImageWithBounds(blobUrl, bounds, padding, resolve, reject);
          })
          .catch((err) => {
            console.error('Failed to fetch file:', err);
            reject(err);
          });
      } else {
        loadAndCropImageWithBounds(uriToLoad, bounds, padding, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper to load and crop using DOM Image constructor
 */
function loadAndCropImageWithBounds(
  imageUri: string,
  bounds: FaceBounds,
  padding: number,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
) {
  // Use DOM Image constructor, not React Native Image
  const img = new (window as any).Image();
  img.crossOrigin = 'anonymous';

  img.onload = () => {
    try {
      const originX = Math.max(0, bounds.origin.x - padding);
      const originY = Math.max(0, bounds.origin.y - padding);
      const cropWidth = Math.min(
        bounds.size.width + padding * 2,
        img.width - originX
      );
      const cropHeight = Math.min(
        bounds.size.height + padding * 2,
        img.height - originY
      );

      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(`Invalid crop dimensions: ${cropWidth}x${cropHeight}`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(
        img,
        originX,
        originY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);

      if (imageUri.startsWith('blob:')) {
        URL.revokeObjectURL(imageUri);
      }

      resolve(croppedImageUrl);
    } catch (error) {
      console.error('Crop failed:', error);
      reject(error);
    }
  };

  img.onerror = (err) => {
    console.error('Image load failed:', err);
    reject(new Error(`Failed to load image: ${imageUri}`));
  };

  img.src = imageUri;
}
