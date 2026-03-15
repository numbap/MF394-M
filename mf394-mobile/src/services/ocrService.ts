/**
 * ocrService — Platform-specific OCR.
 * Platform-specific implementations handle this service:
 *   ocrService.native.ts — iOS & Android (ML Kit)
 *   ocrService.web.ts    — Web (Tesseract.js)
 *
 * This file should never be reached by the bundler.
 */
export type OcrLine = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  center: { x: number; y: number };
};

export async function ocrImage(_uri: string): Promise<OcrLine[]> {
  throw new Error(
    'ocrService: no platform-specific implementation loaded. ' +
      'Expected ocrService.native.ts or ocrService.web.ts to be resolved.'
  );
}
