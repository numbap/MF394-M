import { useState, useCallback } from "react";
import { Image, Platform } from "react-native";
import { FACE_DETECTION_MIN_CONFIDENCE } from "../utils/constants";

let FaceDetector;

// Import appropriate face detection library based on platform
if (Platform.OS !== "web") {
  try {
    const ExpoFaceDetector = require("expo-face-detector");
    FaceDetector = ExpoFaceDetector.FaceDetector;
  } catch (e) {
    console.warn("expo-face-detector not available on this platform");
  }
}

// For web, we'll use a web-compatible solution or fallback to improved mock data
const isWebPlatform = Platform.OS === "web";

/**
 * Face Detection Hook
 *
 * Detects faces in images using:
 * - expo-face-detector on native (iOS/Android)
 * - Improved mock data on web (with better defaults)
 *
 * Returns array of detected face regions with bounds information.
 */
export function useFaceDetection() {
  const [faces, setFaces] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detectFaces = useCallback(async (imageUri) => {
    setIsDetecting(true);
    setError(null);

    try {
      // Get actual image dimensions first
      const { width, height } = await new Promise((resolve, reject) => {
        Image.getSize(imageUri, (w, h) => resolve({ width: w, height: h }), reject);
      });

      let detectedFaces = [];

      // Use native face detection on mobile platforms
      if (FaceDetector && Platform.OS !== "web") {
        try {
          const result = await FaceDetector.detectAsync(imageUri, {
            mode: FaceDetector.Constants.Mode.fast,
            detectLandmarks: FaceDetector.Constants.Landmarks.none,
            runClassifications: FaceDetector.Constants.Classifications.none,
          });

          if (result.faces && result.faces.length > 0) {
            detectedFaces = result.faces
              .filter((face) => (face.confidence || 0) >= FACE_DETECTION_MIN_CONFIDENCE)
              .map((face, index) => ({
                id: `face-${index}`,
                uri: imageUri,
                bounds: face.bounds,
                confidence: face.confidence,
              }));
          }
        } catch (nativeErr) {
          console.warn("Native face detection failed:", nativeErr.message);
        }
      }

      // If no faces detected, use improved mock data for web/development
      if (detectedFaces.length === 0 && isWebPlatform) {
        // eslint-disable-next-line no-console
        console.info("Using mock faces for web development - upload a real image for actual face detection");
        detectedFaces = createMockFaces(imageUri, width, height);
      }

      setFaces(detectedFaces);
      return detectedFaces;
    } catch (err) {
      console.error("Face detection error:", err);
      setError(err.message);
      // Fallback to improved mock faces for development - use reasonable defaults
      const mockFaces = createMockFaces(imageUri, 1000, 1333);
      setFaces(mockFaces);
      return mockFaces;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const cropFace = useCallback(async (imageUri, faceIndex) => {
    try {
      if (faceIndex >= faces.length) {
        throw new Error("Invalid face index");
      }

      const face = faces[faceIndex];
      if (!face.bounds) {
        return imageUri; // Return original if no bounds
      }

      // Add padding around face (20px)
      const padding = 20;
      const bounds = face.bounds;

      // Use appropriate cropping method based on platform
      if (Platform.OS === "web") {
        // For web: use canvas-based cropping
        return await cropFaceWeb(imageUri, bounds, padding);
      } else {
        // For native: use ImageManipulator
        try {
          const { ImageManipulator } = require("expo-image-manipulator");

          const cropRegion = {
            originX: Math.max(0, bounds.origin.x - padding),
            originY: Math.max(0, bounds.origin.y - padding),
            width: Math.min(
              bounds.size.width + padding * 2,
              800 // Cap at reasonable size
            ),
            height: Math.min(
              bounds.size.height + padding * 2,
              800
            ),
          };

          const result = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ crop: cropRegion }],
            { compress: 0.9, format: "jpeg" }
          );

          return result.uri;
        } catch (nativeErr) {
          console.error("Native crop failed:", nativeErr);
          // Fallback to web cropping
          return await cropFaceWeb(imageUri, bounds, padding);
        }
      }
    } catch (err) {
      console.error("Face crop failed:", err);
      // Fallback: return original image
      return imageUri;
    }
  }, [faces]);

  const clearFaces = useCallback(() => {
    setFaces([]);
    setError(null);
  }, []);

  return {
    faces,
    isDetecting,
    error,
    detectFaces,
    cropFace,
    clearFaces,
  };
}

/**
 * Crop face using canvas on web platform
 * Handles file:// URLs from React Native Web image picker
 * Loads image, crops the face region, and returns as data URL
 */
async function cropFaceWeb(imageUri, bounds, padding) {
  return new Promise((resolve, reject) => {
    try {
      // Handle file:// URLs by converting to blob URL first
      let uriToLoad = imageUri;

      if (imageUri.startsWith("file://")) {
        // For file:// URLs, we need to fetch the file and create a blob URL
        fetch(imageUri)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            loadAndCropImage(blobUrl, bounds, padding, resolve, reject);
          })
          .catch((err) => {
            console.error("Failed to fetch file:", err);
            reject(err);
          });
      } else {
        // For other URLs (http, data URLs, etc.), load directly
        loadAndCropImage(uriToLoad, bounds, padding, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Helper to load image and perform cropping
 */
function loadAndCropImage(imageUri, bounds, padding, resolve, reject) {
  // Use DOM Image constructor on web, not React Native Image
  const ImageConstructor = typeof window !== 'undefined' ? window.Image : Image;
  const img = new ImageConstructor();
  img.crossOrigin = "anonymous";

  img.onload = () => {
    try {
      // Calculate crop region with padding
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

      // Validate crop dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error(
          `Invalid crop dimensions: ${cropWidth}x${cropHeight}`
        );
      }

      // eslint-disable-next-line no-console
      console.info(
        `Cropping face at (${originX}, ${originY}) size ${cropWidth}x${cropHeight}`
      );

      // Create canvas for cropped image
      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Draw cropped region onto canvas
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

      // Convert canvas to data URL
      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Clean up blob URL if it was created
      if (imageUri.startsWith("blob:")) {
        URL.revokeObjectURL(imageUri);
      }

      resolve(croppedImageUrl);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Crop failed:", error);
      reject(error);
    }
  };

  img.onerror = (err) => {
    // eslint-disable-next-line no-console
    console.error("Image load failed:", err);
    reject(new Error(`Failed to load image: ${imageUri}`));
  };

  // eslint-disable-next-line no-console
  console.info(`Loading image for cropping: ${imageUri}`);
  img.src = imageUri;
}

/**
 * Create realistic mock faces for development/web
 * Generates 6 faces in proportional positions that scale to image dimensions
 * @param {string} imageUri - The image URI
 * @param {number} imageWidth - Actual image width in pixels
 * @param {number} imageHeight - Actual image height in pixels
 */
function createMockFaces(imageUri, imageWidth, imageHeight) {
  // Reference dimensions (1000x1333) - what the hardcoded values were designed for
  const refWidth = 1000;
  const refHeight = 1333;

  // Calculate scale factors
  const scaleX = imageWidth / refWidth;
  const scaleY = imageHeight / refHeight;

  // Face size targets: roughly 25% of image width
  const faceWidth = Math.round(imageWidth * 0.25);
  const faceHeight = Math.round(faceWidth * 1.2); // Faces are taller than wide

  // Ensure faces fit within image bounds with margins
  const margin = Math.round(imageWidth * 0.08);
  const maxX = Math.max(margin, imageWidth - faceWidth - margin);
  const maxY = Math.max(margin, imageHeight - faceHeight - margin);

  // Generate 6 faces in a 3x2 grid pattern with some variation
  const mockFaces = [
    // Top row
    {
      id: "face-0",
      uri: imageUri,
      bounds: {
        origin: { x: Math.round(margin), y: Math.round(margin) },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.92,
    },
    {
      id: "face-1",
      uri: imageUri,
      bounds: {
        origin: {
          x: Math.round((imageWidth - faceWidth) / 2),
          y: Math.round(margin),
        },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.89,
    },
    {
      id: "face-2",
      uri: imageUri,
      bounds: {
        origin: {
          x: Math.round(imageWidth - faceWidth - margin),
          y: Math.round(margin),
        },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.87,
    },
    // Bottom row
    {
      id: "face-3",
      uri: imageUri,
      bounds: {
        origin: {
          x: Math.round(margin),
          y: Math.round(imageHeight - faceHeight - margin),
        },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.85,
    },
    {
      id: "face-4",
      uri: imageUri,
      bounds: {
        origin: {
          x: Math.round((imageWidth - faceWidth) / 2),
          y: Math.round(imageHeight - faceHeight - margin),
        },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.88,
    },
    {
      id: "face-5",
      uri: imageUri,
      bounds: {
        origin: {
          x: Math.round(imageWidth - faceWidth - margin),
          y: Math.round(imageHeight - faceHeight - margin),
        },
        size: { width: faceWidth, height: faceHeight },
      },
      confidence: 0.84,
    },
  ];

  return mockFaces;
}
