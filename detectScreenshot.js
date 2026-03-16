/**
 * detectScreenshot - Multi-signal heuristic to determine if an image is a screenshot or photo.
 *
 * Signals (in priority order):
 * 1. EXIF camera tags (JPEG only) → definitely a photo
 * 2. File size > 2MB → almost certainly a camera photo, not a screenshot
 * 3. PNG with no EXIF → likely a screenshot (all platforms default to PNG for screenshots)
 * 4. Color entropy analysis → tiebreaker for ambiguous cases
 *
 * @param {File} file - The original File object
 * @param {string} base64DataUrl - The compressed base64 data URL (for canvas analysis)
 * @returns {Promise<{isScreenshot: boolean, confidence: string, reason: string, entropy?: number}>}
 */
export async function detectScreenshot(file, base64DataUrl) {
  // Signal 1: EXIF camera tags (JPEG only) — conclusive
  if (file.type === "image/jpeg" || file.type === "image/jpg") {
    const exifResult = await checkExifForCamera(file);
    if (exifResult.hasCameraTags) {
      return {
        isScreenshot: false,
        confidence: "high",
        reason: "camera-exif",
      };
    }
  }

  // Signal 2: PNG format — screenshots are almost always PNG (even large ones)
  if (file.type === "image/png") {
    return {
      isScreenshot: true,
      confidence: "medium",
      reason: "png-format",
    };
  }

  // Signal 3: File size — camera JPEGs are almost always > 2MB
  if (file.size > 2 * 1024 * 1024) {
    return {
      isScreenshot: false,
      confidence: "high",
      reason: "large-file-size",
    };
  }

  // Signal 4: Color entropy analysis — tiebreaker for small JPEGs without EXIF
  const entropyResult = await analyzeColorEntropy(base64DataUrl);
  return entropyResult;
}

/**
 * Parse JPEG file bytes for EXIF APP1 marker and look for camera-specific IFD0 tags.
 * Tags checked: Make (0x010F), Model (0x0110), GPS IFD pointer (0x8825)
 */
async function checkExifForCamera(file) {
  try {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // JPEG starts with 0xFFD8
    if (view.getUint16(0) !== 0xffd8) {
      return { hasCameraTags: false };
    }

    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset);

      // APP1 marker (EXIF) = 0xFFE1
      if (marker === 0xffe1) {
        const segmentLength = view.getUint16(offset + 2);
        const exifOffset = offset + 4;

        // Check for "Exif\0\0" header
        if (
          exifOffset + 6 <= view.byteLength &&
          view.getUint32(exifOffset) === 0x45786966 &&
          view.getUint16(exifOffset + 4) === 0x0000
        ) {
          const tiffOffset = exifOffset + 6;
          const hasTags = parseTiffForCameraTags(view, tiffOffset);
          return { hasCameraTags: hasTags };
        }

        offset += 2 + segmentLength;
        continue;
      }

      // Skip other markers
      if ((marker & 0xff00) === 0xff00) {
        if (marker === 0xffd9) break; // End of image
        if (marker === 0xffda) break; // Start of scan (image data)
        const len = view.getUint16(offset + 2);
        offset += 2 + len;
      } else {
        break;
      }
    }

    return { hasCameraTags: false };
  } catch {
    return { hasCameraTags: false };
  }
}

/**
 * Parse TIFF header within EXIF to find camera-specific IFD0 tags.
 */
function parseTiffForCameraTags(view, tiffOffset) {
  try {
    if (tiffOffset + 8 > view.byteLength) return false;

    // Determine byte order
    const byteOrder = view.getUint16(tiffOffset);
    const isLittleEndian = byteOrder === 0x4949; // "II"

    // Read IFD0 offset (relative to TIFF start)
    const ifd0RelOffset = view.getUint32(tiffOffset + 4, isLittleEndian);
    const ifd0Offset = tiffOffset + ifd0RelOffset;

    if (ifd0Offset + 2 > view.byteLength) return false;

    // Read number of IFD entries
    const numEntries = view.getUint16(ifd0Offset, isLittleEndian);

    const cameraTags = new Set([0x010f, 0x0110, 0x8825]); // Make, Model, GPS IFD

    for (let i = 0; i < numEntries; i++) {
      const entryOffset = ifd0Offset + 2 + i * 12;
      if (entryOffset + 12 > view.byteLength) break;

      const tag = view.getUint16(entryOffset, isLittleEndian);
      if (cameraTags.has(tag)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Draw image to a small canvas and compute Shannon entropy of the color distribution.
 * Screenshots (flat UI, solid colors) produce low entropy.
 * Photos (gradients, noise, textures) produce high entropy.
 *
 * Only used as a tiebreaker for small JPEGs without EXIF data.
 * Threshold is conservative (3.0) to avoid false positives on compressed photos.
 */
async function analyzeColorEntropy(base64DataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Build histogram with quantized colors (reduce to ~64 buckets)
        const histogram = new Map();
        const totalPixels = size * size;

        for (let i = 0; i < pixels.length; i += 4) {
          const r = Math.floor(pixels[i] / 64);
          const g = Math.floor(pixels[i + 1] / 64);
          const b = Math.floor(pixels[i + 2] / 64);
          const key = (r << 4) | (g << 2) | b;

          histogram.set(key, (histogram.get(key) || 0) + 1);
        }

        // Compute Shannon entropy
        let entropy = 0;
        for (const count of histogram.values()) {
          const p = count / totalPixels;
          if (p > 0) {
            entropy -= p * Math.log2(p);
          }
        }

        // Conservative threshold: only classify as screenshot if entropy is very low.
        // Real screenshots (flat UI) typically have entropy < 2.5.
        // Compressed photos can have entropy as low as 3.0.
        const isScreenshot = entropy < 3.0;

        resolve({
          isScreenshot,
          confidence: entropy < 2.0 ? "high" : entropy < 3.5 ? "medium" : "low",
          reason: "color-entropy",
          entropy: Math.round(entropy * 100) / 100,
        });
      } catch {
        resolve({
          isScreenshot: false,
          confidence: "low",
          reason: "entropy-error",
        });
      }
    };

    img.onerror = () => {
      resolve({
        isScreenshot: false,
        confidence: "low",
        reason: "image-load-error",
      });
    };

    img.src = base64DataUrl;
  });
}
