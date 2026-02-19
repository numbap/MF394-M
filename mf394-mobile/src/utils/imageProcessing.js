import * as ImageManipulator from "expo-image-manipulator";

export const imageProcessing = {
  async cropImage(imageUri, cropData) {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropData.x,
              originY: cropData.y,
              width: cropData.width,
              height: cropData.height,
            },
          },
          { resize: { width: 500, height: 500 } },
        ],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipResult.uri;
    } catch (error) {
      console.error("Error cropping image:", error);
      throw error;
    }
  },

  async resizeImage(imageUri, width = 500, height = 500) {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width, height } }],
        { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
      );

      return manipResult.uri;
    } catch (error) {
      console.error("Error resizing image:", error);
      throw error;
    }
  },

  async extractFaceFromBounds(imageUri, faceBounds) {
    const cropData = {
      x: Math.max(0, faceBounds.left - 10),
      y: Math.max(0, faceBounds.top - 10),
      width: Math.min(faceBounds.width + 20, faceBounds.width),
      height: Math.min(faceBounds.height + 20, faceBounds.height),
    };

    return this.cropImage(imageUri, cropData);
  },
};
