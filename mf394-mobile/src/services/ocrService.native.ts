/**
 * ocrService.native — OCR for iOS & Android using ML Kit.
 * Returns word-level segments normalized through regroupWords().
 */
import { regroupWords } from './nameMatch';

let TextRecognition: any = null;
try {
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
} catch (e) {
  console.warn('@react-native-ml-kit/text-recognition not available:', (e as Error).message);
}

export type OcrLine = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  center: { x: number; y: number };
};

export async function ocrImage(uri: string): Promise<OcrLine[]> {
  if (!TextRecognition) {
    console.warn('OCR unavailable: TextRecognition module failed to load');
    return [];
  }
  const result = await TextRecognition.recognize(uri);

  const words: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];

  for (const block of result.blocks || []) {
    for (const line of block.lines || []) {
      for (const element of (line as any).elements || []) {
        const text = (element.text || '').trim();
        if (!text) continue;

        const frame = element.frame;
        if (!frame) continue;

        words.push({
          text,
          bbox: {
            x0: frame.x ?? frame.left ?? 0,
            y0: frame.y ?? frame.top ?? 0,
            x1: (frame.x ?? frame.left ?? 0) + (frame.width ?? 0),
            y1: (frame.y ?? frame.top ?? 0) + (frame.height ?? 0),
          },
        });
      }
    }
  }

  return regroupWords(words);
}
