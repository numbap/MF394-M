/**
 * ocrService.web — OCR for Web using Tesseract.js.
 * Mirrors the output of ocrScreenshot.js from the repo root.
 */
import { createWorker } from 'tesseract.js';
import { regroupWords } from './nameMatch';

export type OcrLine = {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  center: { x: number; y: number };
};

let workerInstance: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getWorker(): Promise<Awaited<ReturnType<typeof createWorker>>> {
  if (!workerInstance) {
    workerInstance = await createWorker('eng');
  }
  return workerInstance;
}

export async function ocrImage(uri: string): Promise<OcrLine[]> {
  const worker = await getWorker();
  const result = await worker.recognize(uri, {}, { blocks: true } as any);
  const blocks: any[] = (result.data as any).blocks || [];

  if (blocks.length === 0) return [];

  const allWords: Array<{ text: string; bbox: { x0: number; y0: number; x1: number; y1: number } }> = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          const text = (word.text || '').trim();
          if (text && word.confidence > 50) {
            allWords.push({ text, bbox: word.bbox });
          }
        }
      }
    }
  }

  return regroupWords(allWords);
}
