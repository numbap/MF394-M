import { useState, useCallback, useRef, useEffect } from "react";
import { Image, Platform } from "react-native";
import { FACE_DETECTION_MIN_CONFIDENCE } from "../utils/constants";

let ExpoFaceDetector;
let faceapi;

// Import appropriate face detection library based on platform
if (Platform.OS !== "web") {
  try {
    ExpoFaceDetector = require("expo-face-detector");
    // Exports: detectFacesAsync, FaceDetectorMode, FaceDetectorLandmarks, FaceDetectorClassifications
  } catch (e) {
    console.warn("expo-face-detector not available on this platform");
  }
}

const isWebPlatform = Platform.OS === "web";

/**
 * Load face-api from CDN on web platform
 * Returns promise that resolves when face-api is ready
 */
async function loadFaceApiFromCDN() {
  if (!isWebPlatform || typeof window === "undefined") {
    console.log("Not web platform, skipping CDN load");
    return null;
  }

  // Check if already loaded
  if (window.faceapi) {
    console.log("face-api.js already available globally");
    return window.faceapi;
  }

  console.log("Starting to load face-api.js from CDN...");

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Try the original vladmandic version that worked in old app
    script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      console.log("Script loaded from CDN");
      if (window.faceapi) {
        console.log("face-api.js available on window.faceapi");
        faceapi = window.faceapi;
        resolve(window.faceapi);
      } else {
        console.error("Script loaded but window.faceapi not available");
        // Try to find it under different names
        console.log("Available on window:", Object.keys(window).filter(k => k.includes('face') || k.includes('Face')));
        reject(new Error("window.faceapi not available after script load"));
      }
    };

    script.onerror = (err) => {
      console.error("Failed to load face-api.js from CDN:", err);
      reject(new Error("Failed to load face-api.js from CDN"));
    };

    script.onreadystatechange = function () {
      if (this.readyState === "loaded" || this.readyState === "complete") {
        console.log("Script readyState:", this.readyState);
      }
    };

    console.log("Appending script to document head");
    document.head.appendChild(script);
  });
}

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

  // Load face-api from CDN and initialize models on web
  useEffect(() => {
    if (!isWebPlatform || modelsLoaded || typeof window === "undefined") {
      return;
    }

    const initializeFaceApi = async () => {
      try {
        // Load face-api library from CDN
        console.log("Attempting to load face-api from CDN...");
        const api = await loadFaceApiFromCDN();

        if (!api || !api.nets) {
          console.warn("face-api library failed to load from CDN");
          if (isMountedRef.current) {
            setModelsLoaded(true); // Set true to allow fallback
          }
          return;
        }

        faceapi = api;

        // Load models from CDN
        const modelsUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
        console.log("Loading face-api models from:", modelsUrl);

        await faceapi.nets.tinyFaceDetector.load(modelsUrl);

        if (isMountedRef.current) {
          console.log("face-api successfully initialized with models");
          setModelsLoaded(true);
        }
      } catch (err) {
        console.error("Error initializing face-api:", err);
        if (isMountedRef.current) {
          setModelsLoaded(true); // Set true to allow fallback
        }
      }
    };

    initializeFaceApi();
  }, [isWebPlatform, modelsLoaded]);

  const detectFaces = useCallback(
    async (imageUri) => {
      if (!isMountedRef.current) return { faces: [], isRealDetection: false };

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
        let isRealDetection = false;

        // Use face-api on web
        if (isWebPlatform && faceapi && modelsLoaded) {
          try {
            detectedFaces = await detectFacesWeb(imageUri, width, height);
            if (detectedFaces.length > 0) {
              isRealDetection = true;
            }
          } catch (webErr) {
            console.warn(
              "Web face detection failed:",
              webErr.message
            );
            detectedFaces = [];
          }
        }

        // Use native face detection on mobile platforms
        if (detectedFaces.length === 0 && ExpoFaceDetector && Platform.OS !== "web") {
          try {
            const result = await ExpoFaceDetector.detectFacesAsync(imageUri, {
              mode: ExpoFaceDetector.FaceDetectorMode.fast,
              detectLandmarks: ExpoFaceDetector.FaceDetectorLandmarks.none,
              runClassifications: ExpoFaceDetector.FaceDetectorClassifications.none,
            });

            if (result.faces && result.faces.length > 0) {
              detectedFaces = result.faces.map((face, index) => ({
                id: `face-${index}`,
                uri: imageUri,
                bounds: face.bounds,
                confidence: 1, // expo-face-detector doesn't expose a confidence score
              }));
              isRealDetection = true;
            }
          } catch (nativeErr) {
            console.warn("Native face detection failed:", nativeErr.message);
          }
        }

        // Log when no real faces detected - don't create mock fallback
        if (detectedFaces.length === 0) {
          console.warn(
            "No real faces detected. isWebPlatform:", isWebPlatform,
            "faceapi:", !!faceapi,
            "modelsLoaded:", modelsLoaded,
            "ExpoFaceDetector:", !!ExpoFaceDetector,
            "User will proceed to manual cropping"
          );
        }

        if (isMountedRef.current) {
          setFaces(detectedFaces);
        }
        return { faces: detectedFaces, isRealDetection };
      } catch (err) {
        console.error("Face detection error:", err);
        if (isMountedRef.current) {
          setError(err.message);
        }
        return { faces: [], isRealDetection: false };
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
          const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");

          const cropRegion = {
            originX: Math.max(0, bounds.origin.x - padding),
            originY: Math.max(0, bounds.origin.y - padding),
            width: Math.min(
              bounds.size.width + padding * 2,
              800 // Cap at reasonable size
            ),
            height: Math.min(bounds.size.height + padding * 2, 800),
          };

          const result = await manipulateAsync(
            imageUri,
            [{ crop: cropRegion }],
            { compress: 0.9, format: SaveFormat.JPEG }
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
    // Use DOM Image constructor, not React Native Image
    const img = new window.Image();
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

        // Get faceapi from window if not already in module scope
        const api = faceapi || window.faceapi;

        // Verify faceapi is ready
        if (!api || !api.detectAllFaces) {
          throw new Error("face-api.detectAllFaces not available");
        }

        console.log("Starting face detection with face-api...");

        // Detect faces using face-api with TinyFaceDetector
        const detections = await api
          .detectAllFaces(
            canvas,
            new api.TinyFaceDetectorOptions({
              inputSize: 992,
              scoreThreshold: 0.4,
            })
          )
          .run();

        console.log(`Detected ${detections ? detections.length : 0} faces`);

        if (detections && detections.length > 0) {
          const faces = extractFacesFromDetections(img, detections, imageUri);
          console.log(`Extracted ${faces.length} face crops`);
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

    console.log("Loading image for face detection:", imageUri.substring(0, 100));

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
export function extractFacesFromDetections(img, detections, imageUri) {
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
export function createMockFaces(imageUri, imageWidth, imageHeight) {
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
