import { useState, useCallback, useRef, useEffect } from "react";
import { Image, Platform } from "react-native";
// uuidv4 relies on crypto.getRandomValues() which is unavailable in Hermes on Android.
// Use a Math.random()-based generator which is safe in all JS environments.
const generateId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

let FaceDetection;
let faceapi;

// Import ML Kit face detection on native platforms
if (Platform.OS !== "web") {
  try {
    FaceDetection = require("@react-native-ml-kit/face-detection").default;
  } catch (e) {
    console.warn("@react-native-ml-kit/face-detection not available:", e.message);
  }
}

const isWebPlatform = Platform.OS === "web";

/**
 * Load face-api from CDN on web platform
 * Returns promise that resolves when face-api is ready
 */
async function loadFaceApiFromCDN() {
  if (!isWebPlatform || typeof window === "undefined") {
    return null;
  }

  // Check if already loaded
  if (window.faceapi) {
    return window.faceapi;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Try the original vladmandic version that worked in old app
    script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      if (window.faceapi) {
        faceapi = window.faceapi;
        resolve(window.faceapi);
      } else {
        console.error("Script loaded but window.faceapi not available");
        reject(new Error("window.faceapi not available after script load"));
      }
    };

    script.onerror = (err) => {
      console.error("Failed to load face-api.js from CDN:", err);
      reject(new Error("Failed to load face-api.js from CDN"));
    };

    script.onreadystatechange = function () {
    };

    document.head.appendChild(script);
  });
}

/**
 * Face Detection Hook
 *
 * Detects faces in images using:
 * - face-api.js (TinyFaceDetector) on web
 * - @react-native-ml-kit/face-detection on native (iOS/Android)
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

        await faceapi.nets.tinyFaceDetector.load(modelsUrl);

        if (isMountedRef.current) {
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
            console.warn("Web face detection failed:", webErr.message);
            detectedFaces = [];
          }
        }

        // Use ML Kit on native (iOS/Android)
        if (detectedFaces.length === 0 && FaceDetection && Platform.OS !== "web") {
          try {
            const mlkitFaces = await FaceDetection.detect(imageUri, {
              performanceMode: "accurate",
              landmarkMode: "none",
              contourMode: "none",
              classificationMode: "none",
              minFaceSize: 0.05, // detect faces as small as 5% of image width
            });

            if (mlkitFaces && mlkitFaces.length > 0) {
              detectedFaces = mlkitFaces.map((face) => ({
                id: generateId(),
                uri: imageUri,
                bounds: {
                  origin: { x: face.frame.left, y: face.frame.top },
                  size: { width: face.frame.width, height: face.frame.height },
                },
                confidence: 1,
              }));
              isRealDetection = true;
            }
          } catch (nativeErr) {
            console.error(
              "Native face detection failed:",
              nativeErr.message,
              "\nURI:", imageUri?.substring(0, 120),
            );
          }
        }

        if (detectedFaces.length === 0) {
          console.warn(
            "No real faces detected. isWebPlatform:", isWebPlatform,
            "faceapi:", !!faceapi,
            "modelsLoaded:", modelsLoaded,
            "FaceDetection:", !!FaceDetection,
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
        return imageUri;
      }

      const padding = 25;
      const bounds = face.bounds;

      if (Platform.OS === "web") {
        return await cropFaceWeb(imageUri, bounds, padding);
      } else {
        try {
          const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");

          const cropRegion = {
            originX: Math.max(0, bounds.origin.x - padding),
            originY: Math.max(0, bounds.origin.y - padding),
            width: Math.min(bounds.size.width + padding * 2, 800),
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
          return await cropFaceWeb(imageUri, bounds, padding);
        }
      }
    } catch (err) {
      console.error("Face crop failed:", err);
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
 */
async function detectFacesWeb(imageUri, imageWidth, imageHeight) {
  return new Promise((resolve, reject) => {
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

        const api = faceapi || window.faceapi;

        if (!api || !api.detectAllFaces) {
          throw new Error("face-api.detectAllFaces not available");
        }

        const detections = await api
          .detectAllFaces(
            canvas,
            new api.TinyFaceDetectorOptions({
              inputSize: 992,
              scoreThreshold: 0.4,
            })
          )
          .run();

        if (detections && detections.length > 0) {
          const faces = extractFacesFromDetections(img, detections, imageUri);
          resolve(faces);
        } else {
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
 */
export function extractFacesFromDetections(img, detections, imageUri) {
  const faces = [];
  const padding = 25;

  if (!detections || !Array.isArray(detections) || detections.length === 0) {
    return faces;
  }

  for (let i = 0; i < detections.length; i++) {
    try {
      const detection = detections[i];

      if (!detection) continue;

      const box = detection.box || (detection.detection && detection.detection.box);

      if (!box) continue;

      const { x, y, width, height } = box;

      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof width !== "number" ||
        typeof height !== "number"
      ) {
        continue;
      }

      if (width <= 0 || height <= 0) continue;

      const paddedX = Math.max(0, x - padding);
      const paddedY = Math.max(0, y - padding);
      let paddedWidth = Math.min(img.width - paddedX, width + padding * 2);
      let paddedHeight = Math.min(img.height - paddedY, height + padding * 2);

      if (paddedWidth <= 0 || paddedHeight <= 0) continue;

      const squareSize = Math.max(paddedWidth, paddedHeight);

      let cropX = paddedX;
      let cropY = paddedY;
      let cropWidth = squareSize;
      let cropHeight = squareSize;

      if (cropX + cropWidth > img.width) cropX = img.width - cropWidth;
      if (cropY + cropHeight > img.height) cropY = img.height - cropHeight;

      cropX = Math.max(0, cropX);
      cropY = Math.max(0, cropY);
      cropWidth = Math.min(img.width - cropX, squareSize);
      cropHeight = Math.min(img.height - cropY, squareSize);

      faces.push({
        id: generateId(),
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
 */
async function cropFaceWeb(imageUri, bounds, padding) {
  return new Promise((resolve, reject) => {
    try {
      let uriToLoad = imageUri;

      if (imageUri.startsWith("file://")) {
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
        loadAndCropImage(uriToLoad, bounds, padding, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function loadAndCropImage(imageUri, bounds, padding, resolve, reject) {
  const ImageConstructor = typeof window !== "undefined" ? window.Image : Image;
  const img = new ImageConstructor();
  img.crossOrigin = "anonymous";

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

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      ctx.drawImage(img, originX, originY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.9);

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

  img.src = imageUri;
}

/**
 * Create mock faces for fallback testing
 */
export function createMockFaces(imageUri, imageWidth, imageHeight) {
  const faceWidth = Math.round(imageWidth * 0.25);
  const faceHeight = Math.round(faceWidth * 1.2);
  const margin = Math.round(imageWidth * 0.08);

  const mockFaces = [
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
