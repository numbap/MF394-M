export async function cropImageNative({
  imageUri,
  imageDimensions,
  zoom,
  offsetX,
  offsetY,
  canvasSize,
}: {
  imageUri: string;
  imageDimensions: { width: number; height: number };
  zoom: number;
  offsetX: number;
  offsetY: number;
  canvasSize: number;
}): Promise<string> {
  try {
    const { manipulateAsync, SaveFormat } = require("expo-image-manipulator");

    const { width: imgW, height: imgH } = imageDimensions;
    const z = zoom;
    const ox = offsetX;
    const oy = offsetY;

    const scaledWidth = imgW * z;
    const scaledHeight = imgH * z;

    const cs = canvasSize;
    // Raw crop origin in source-image coordinates
    const rawOriginX = (scaledWidth / 2 - cs / 2 - ox) / z;
    const rawOriginY = (scaledHeight / 2 - cs / 2 - oy) / z;

    // Clamp origin so it stays inside the image
    const originX = Math.max(0, Math.min(Math.round(rawOriginX), imgW - 1));
    const originY = Math.max(0, Math.min(Math.round(rawOriginY), imgH - 1));

    // Clamp size so origin + size never exceeds the image boundary.
    // Without this, zooming out to "fit" level produces CANVAS_SIZE/zoom > imageDimension
    // which throws "Invalid crop operation" from expo-image-manipulator.
    const rawSize = cs / z;
    const cropWidth = Math.min(Math.round(rawSize), imgW - originX);
    const cropHeight = Math.min(Math.round(rawSize), imgH - originY);

    // Image.getSize returns actual file pixel dimensions. expo-image-manipulator uses
    // the same file pixel coordinate space. No PixelRatio conversion is needed here.

    const result = await manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX,
            originY,
            width: Math.max(1, cropWidth),
            height: Math.max(1, cropHeight),
          },
        },
        // Cap output so large zoomed-out crops don't produce oversized upload payloads
        cropWidth > cropHeight
          ? { resize: { width: 800 } }
          : { resize: { height: 800 } },
      ],
      { compress: 0.85, format: SaveFormat.JPEG, base64: true }
    );

    if (!result.base64) {
      throw new Error("Crop produced no image data");
    }
    return `data:image/jpeg;base64,${result.base64}`;
  } catch (error) {
    console.error("Native crop failed:", error);
    throw error;
  }
}
