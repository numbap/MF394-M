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
      // Verify image can be loaded
      await new Promise((resolve, reject) => {
        Image.getSize(imageUri, resolve, reject);
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
        detectedFaces = createMockFaces(imageUri);
      }

      setFaces(detectedFaces);
      return detectedFaces;
    } catch (err) {
      console.error("Face detection error:", err);
      setError(err.message);
      // Fallback to improved mock faces for development
      const mockFaces = createMockFaces(imageUri);
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
  const img = new Image();
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
 * Generates 6 faces in proportional positions
 * Since we don't know image dimensions, use conservative estimates
 */
function createMockFaces(imageUri) {
  // Assume typical photo dimensions and scale proportionally
  // For most phone photos: width ~1000-4000, height ~1333-5333
  // Use proportional positions that work with most image sizes

  const mockFaces = [
    // Top left
    {
      id: "face-0",
      uri: imageUri,
      bounds: {
        origin: { x: 100, y: 150 },
        size: { width: 250, height: 300 },
      },
      confidence: 0.92,
    },
    // Top center
    {
      id: "face-1",
      uri: imageUri,
      bounds: {
        origin: { x: 375, y: 120 },
        size: { width: 270, height: 330 },
      },
      confidence: 0.89,
    },
    // Top right
    {
      id: "face-2",
      uri: imageUri,
      bounds: {
        origin: { x: 650, y: 150 },
        size: { width: 260, height: 310 },
      },
      confidence: 0.87,
    },
    // Bottom left
    {
      id: "face-3",
      uri: imageUri,
      bounds: {
        origin: { x: 80, y: 520 },
        size: { width: 240, height: 290 },
      },
      confidence: 0.85,
    },
    // Bottom center
    {
      id: "face-4",
      uri: imageUri,
      bounds: {
        origin: { x: 370, y: 480 },
        size: { width: 280, height: 350 },
      },
      confidence: 0.88,
    },
    // Bottom right
    {
      id: "face-5",
      uri: imageUri,
      bounds: {
        origin: { x: 690, y: 520 },
        size: { width: 250, height: 300 },
      },
      confidence: 0.84,
    },
  ];

  return mockFaces;
}
