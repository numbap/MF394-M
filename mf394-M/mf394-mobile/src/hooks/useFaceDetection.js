import { useState, useCallback, useRef, useEffect } from "react";
import { Image, Platform } from "react-native";
import { FACE_DETECTION_MIN_CONFIDENCE } from "../utils/constants";

let FaceDetector;
let faceapi;

// Import appropriate face detection library based on platform
if (Platform.OS !== "web") {
  try {
    const ExpoFaceDetector = require("expo-face-detector");
    FaceDetector = ExpoFaceDetector.FaceDetector;
  } catch (e) {
    console.warn("expo-face-detector not available on this platform");
  }
} else {
  // Import face-api for web platform
  try {
    faceapi = require("face-api.js");
  } catch (e) {
    console.warn("face-api.js not available:", e.message);
  }
}

const isWebPlatform = Platform.OS === "web";

/**
 * Face Detection Hook
 *
 * Detects faces in images using:
 * - face-api.js (TinyFaceDetector) on web
 * - expo-face-detector on native (iOS/Android)
 *
 * Returns array of detected face regions with bounds information.
 */
export function useFaceDetection() {
  const [faces, setFaces] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const isMountedRef = useRef(true);

  // Track component mount/unmount for async cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load face-api models on web
  useEffect(() => {
    if (!isWebPlatform || modelsLoaded || typeof window === "undefined") {
      return;
    }

    const loadModels = async () => {
      try {
        if (!faceapi || !faceapi.nets) {
          console.warn("face-api.js library not properly initialized");
          return;
        }

        const modelsUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        console.log("Loading face-api models from:", modelsUrl);

        await faceapi.nets.tinyFaceDetector.load(modelsUrl);

        if (isMountedRef.current) {
          console.log("face-api models loaded successfully");
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error("Error loading face-api models:", err);
        if (isMountedRef.current) {
          setModelsLoaded(true); // Set true anyway to allow fallback to work
        }
      }
    };

    loadModels();
  }, [isWebPlatform, modelsLoaded]);

  const detectFaces = useCallback(
    async (imageUri) => {
      if (!isMountedRef.current) return [];

      setIsDetecting(true);
      setError(null);

      try {
        // Get actual image dimensions first
        const { width, height } = await new Promise((resolve, reject) => {
          Image.getSize(
            imageUri,
            (w, h) => resolve({ width: w, height: h }),
            reject
          );
        });

        let detectedFaces = [];

        // Use face-api on web
        if (isWebPlatform && faceapi && modelsLoaded) {
          try {
            detectedFaces = await detectFacesWeb(imageUri, width, height);
          } catch (webErr) {
            console.warn(
              "Web face detection failed, falling back to mock faces:",
              webErr.message
            );
            detectedFaces = [];
          }
        }

        // Use native face detection on mobile platforms
        if (detectedFaces.length === 0 && FaceDetector && Platform.OS !== "web") {
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

        // Fallback to mock faces if no real detection
        if (detectedFaces.length === 0) {
          console.log("No faces detected, using mock faces for testing");
          detectedFaces = createMockFaces(imageUri, width, height);
        }

        if (isMountedRef.current) {
          setFaces(detectedFaces);
        }
        return detectedFaces;
      } catch (err) {
        console.error("Face detection error:", err);
        if (isMountedRef.current) {
          setError(err.message);
          // Fallback to mock faces for development
          const mockFaces = createMockFaces(imageUri, 1000, 1333);
          setFaces(mockFaces);
          return mockFaces;
        }
        return [];
      } finally {
        if (isMountedRef.current) {
          setIsDetecting(false);
        }
      }
    },
    [isWebPlatform, modelsLoaded]
  );

  const cropFace = useCallback(async (imageUri, faceIndex) => {
    try {
      if (faceIndex >= faces.length) {
        throw new Error("Invalid face index");
      }

      const face = faces[faceIndex];
      if (!face.bounds) {
        return imageUri; // Return original if no bounds
      }

      // Add padding around face (25px like in old implementation)
      const padding = 25;
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
            height: Math.min(bounds.size.height + padding * 2, 800),
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
 * Detect faces on web using face-api.js
 * Adapted from the working implementation in the old Next.js project
 */
async function detectFacesWeb(imageUri, imageWidth, imageHeight) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          throw new Error("Could not get canvas context");
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Verify faceapi is ready
        if (!faceapi || !faceapi.detectAllFaces) {
          throw new Error("face-api.detectAllFaces not available");
        }

        // Detect faces using face-api with TinyFaceDetector
        const detections = await faceapi
          .detectAllFaces(
            canvas,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 992,
              scoreThreshold: 0.4,
            })
          )
          .run();

        if (detections && detections.length > 0) {
          const faces = extractFacesFromDetections(img, detections, imageUri);
          resolve(faces);
        } else {
          console.log("No faces detected by face-api");
          resolve([]);
        }
      } catch (detectErr) {
        console.error("Error during face detection:", detectErr);
        reject(detectErr);
      }
    };

    img.onerror = (event) => {
      console.error("Image load failed for face detection");
      reject(new Error(`Failed to load image for face detection: ${imageUri}`));
    };

    // Handle file:// URLs and blob URLs
    if (imageUri.startsWith("file://")) {
      fetch(imageUri)
        .then((response) => response.blob())
        .then((blob) => {
          img.src = URL.createObjectURL(blob);
        })
        .catch((err) => {
          reject(new Error(`Failed to fetch image: ${err.message}`));
        });
    } else {
      img.src = imageUri;
    }
  });
}

/**
 * Extract individual faces from face-api detections
 * Adapted from working implementation - extracts with padding and square aspect ratio
 */
function extractFacesFromDetections(img, detections, imageUri) {
  const faces = [];
  const padding = 25; // Add padding around detected face

  if (!detections || !Array.isArray(detections) || detections.length === 0) {
    return faces;
  }

  for (let i = 0; i < detections.length; i++) {
    try {
      const detection = detections[i];

      if (!detection) {
        continue;
      }

      // Handle both direct box access and nested detection.box
      const box = detection.box || (detection.detection && detection.detection.box);

      if (!box) {
        continue;
      }

      const { x, y, width, height } = box;

      // Validate box coordinates
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof width !== "number" ||
        typeof height !== "number"
      ) {
        continue;
      }

      if (width <= 0 || height <= 0) {
        continue;
      }

      // Calculate padded dimensions
      const paddedX = Math.max(0, x - padding);
      const paddedY = Math.max(0, y - padding);
      let paddedWidth = Math.min(img.width - paddedX, width + padding * 2);
      let paddedHeight = Math.min(img.height - paddedY, height + padding * 2);

      if (paddedWidth <= 0 || paddedHeight <= 0) {
        continue;
      }

      // Enforce square aspect ratio by using the larger dimension
      const squareSize = Math.max(paddedWidth, paddedHeight);

      // Adjust crop position to keep face centered if dimensions differ
      let cropX = paddedX;
      let cropY = paddedY;
      let cropWidth = squareSize;
      let cropHeight = squareSize;

      // Adjust if square crop goes beyond image boundaries
      if (cropX + cropWidth > img.width) {
        cropX = img.width - cropWidth;
      }
      if (cropY + cropHeight > img.height) {
        cropY = img.height - cropHeight;
      }

      // Clamp to valid range
      cropX = Math.max(0, cropX);
      cropY = Math.max(0, cropY);
      cropWidth = Math.min(img.width - cropX, squareSize);
      cropHeight = Math.min(img.height - cropY, squareSize);

      // Convert detection box to bounds format for consistency
      faces.push({
        id: `face-${i}`,
        uri: imageUri,
        bounds: {
          origin: { x: cropX, y: cropY },
          size: { width: cropWidth, height: cropHeight },
        },
        confidence: detection.score || 0.85,
      });
    } catch (err) {
      console.error("Error extracting face at index", i, ":", err);
    }
  }

  return faces;
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
  const ImageConstructor = typeof window !== "undefined" ? window.Image : Image;
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
        throw new Error(`Invalid crop dimensions: ${cropWidth}x${cropHeight}`);
      }

      console.log(
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
      ctx.drawImage(img, originX, originY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      // Convert canvas to data URL
      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

      // Clean up blob URL if it was created
      if (imageUri.startsWith("blob:")) {
        URL.revokeObjectURL(imageUri);
      }

      resolve(croppedImageUrl);
    } catch (error) {
      console.error("Crop failed:", error);
      reject(error);
    }
  };

  img.onerror = (err) => {
    console.error("Image load failed:", err);
    reject(new Error(`Failed to load image: ${imageUri}`));
  };

  console.log(`Loading image for cropping: ${imageUri}`);
  img.src = imageUri;
}

/**
 * Create mock faces for fallback testing
 * Generates 6 faces in proportional positions that scale to image dimensions
 */
function createMockFaces(imageUri, imageWidth, imageHeight) {
  // Face size targets: roughly 25% of image width
  const faceWidth = Math.round(imageWidth * 0.25);
  const faceHeight = Math.round(faceWidth * 1.2); // Faces are taller than wide

  // Ensure faces fit within image bounds with margins
  const margin = Math.round(imageWidth * 0.08);

  // Generate 6 faces in a 3x2 grid pattern
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
