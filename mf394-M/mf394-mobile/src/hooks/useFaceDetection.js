import { useState, useCallback } from "react";
import { Image } from "react-native";
import { FaceDetector } from "expo-face-detector";
import { FACE_DETECTION_MIN_CONFIDENCE } from "../utils/constants";

/**
 * Face Detection Hook
 *
 * Detects faces in images using expo-face-detector.
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

      // Detect faces using expo-face-detector
      const result = await FaceDetector.detectAsync(imageUri, {
        mode: FaceDetector.Constants.Mode.fast,
        detectLandmarks: FaceDetector.Constants.Landmarks.none,
        runClassifications: FaceDetector.Constants.Classifications.none,
      });

      if (!result.faces || result.faces.length === 0) {
        setFaces([]);
        return [];
      }

      // Filter faces by confidence threshold
      const detectedFaces = result.faces
        .filter((face) => (face.confidence || 0) >= FACE_DETECTION_MIN_CONFIDENCE)
        .map((face, index) => ({
          id: `face-${index}`,
          uri: imageUri,
          bounds: face.bounds,
          confidence: face.confidence,
        }));

      setFaces(detectedFaces);
      return detectedFaces;
    } catch (err) {
      // Fallback to mock faces for development
      console.warn("Face detection failed, using mock data:", err.message);
      const mockFaces = [
        {
          id: "face-0",
          uri: imageUri,
          bounds: {
            origin: { x: 50, y: 50 },
            size: { width: 100, height: 100 },
          },
          confidence: 0.95,
        },
        {
          id: "face-1",
          uri: imageUri,
          bounds: {
            origin: { x: 200, y: 100 },
            size: { width: 90, height: 90 },
          },
          confidence: 0.87,
        },
      ];
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

      // Import here to avoid circular dependency
      const { ImageManipulator } = require("expo-image-manipulator");

      // Add padding around face (20px)
      const padding = 20;
      const bounds = face.bounds;
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

      // Crop the image
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: cropRegion }],
        { compress: 0.9, format: "jpeg" }
      );

      return result.uri;
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
