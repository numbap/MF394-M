import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { tokenStorage } from "../utils/secureStore";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://ummyou.com/api";

/**
 * Image Service
 *
 * Handles image compression, upload to S3 via API endpoint,
 * and batch operations for party mode.
 */
export const imageService = {
  /**
   * Compress image to reduce file size
   * Target: 1200px max dimension, 85% quality
   */
  async compressImage(imageUri) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200, height: 1200 } }],
        { compress: 0.85, format: "jpeg" }
      );
      return result.uri;
    } catch (error) {
      console.warn("Image compression failed, using original:", error.message);
      return imageUri;
    }
  },

  /**
   * Convert image URI to base64
   */
  async imageToBase64(imageUri) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1]; // Remove data:image/jpeg;base64, prefix
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  },

  /**
   * Upload image to S3 via API endpoint
   * Server will resize to 500x500 and return S3 URL
   */
  async uploadImage(imageUri, metadata = {}) {
    try {
      // Get auth token
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Compress image
      const compressedUri = await this.compressImage(imageUri);

      // Convert to base64
      const base64Data = await this.imageToBase64(compressedUri);

      // Upload to API
      const response = await axios.post(
        `${API_BASE_URL}/upload`,
        {
          image: base64Data,
          metadata: metadata || {},
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 second timeout for large files
        }
      );

      if (!response.data.url) {
        throw new Error("No URL returned from server");
      }

      return response.data.url; // S3 URL
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error(error.response?.data?.message || "Image upload failed");
    }
  },

  /**
   * Upload multiple images in parallel
   * Used for party mode (batch face import)
   */
  async uploadBatchImages(imageUris, metadata = {}) {
    try {
      const uploadPromises = imageUris.map((uri) =>
        this.uploadImage(uri, metadata)
      );
      const results = await Promise.allSettled(uploadPromises);

      return {
        successful: results
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value),
        failed: results
          .filter((r) => r.status === "rejected")
          .map((r) => r.reason.message),
      };
    } catch (error) {
      console.error("Error batch uploading images:", error);
      throw error;
    }
  },

  /**
   * Delete image from S3
   */
  async deleteImage(imageUrl) {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      await axios.post(
        `${API_BASE_URL}/delete`,
        { url: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },
};
