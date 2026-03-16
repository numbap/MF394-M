import { createWorker } from "tesseract.js";
import { regroupWords } from "./nameMatch";

let workerInstance = null;

/**
 * Get or create a Tesseract worker (lazy singleton — reuse across calls).
 */
async function getWorker() {
  if (!workerInstance) {
    workerInstance = await createWorker("eng");
  }
  return workerInstance;
}

/**
 * Run OCR on a screenshot and return text segments with precise bounding boxes.
 *
 * Uses word-level data from Tesseract.js v7, then delegates to regroupWords()
 * (from nameMatch.js) to split words into segments by horizontal gaps.
 *
 * @param {string} imageSource - base64 data URL or blob URL
 * @returns {Promise<Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number }, center: { x: number, y: number } }>>}
 */
export async function ocrScreenshot(imageSource) {
  const worker = await getWorker();
  // v7: must request blocks output to get word/line/bbox data (default is text-only)
  const result = await worker.recognize(imageSource, {}, { blocks: true });
  const blocks = result.data.blocks || [];

  if (blocks.length === 0) {
    console.log("Tesseract: no blocks found");
    return [];
  }

  // Extract all words from nested v7 structure: blocks → paragraphs → lines → words
  const allWords = [];
  for (const block of blocks) {
    for (const paragraph of block.paragraphs || []) {
      for (const line of paragraph.lines || []) {
        for (const word of line.words || []) {
          const text = word.text.trim();
          if (text.length > 0 && word.confidence > 50) {
            allWords.push({
              text,
              bbox: word.bbox,
            });
          }
        }
      }
    }
  }

  if (allWords.length === 0) {
    console.log("Tesseract: no words found");
    return [];
  }

  console.log(`Tesseract: extracted ${allWords.length} words`);

  const textLines = regroupWords(allWords);

  console.log(`Tesseract: grouped into ${textLines.length} text segments`);
  textLines.forEach((l) =>
    console.log(`  "${l.text}" at (${l.center.x}, ${l.center.y})`)
  );

  return textLines;
}

/**
 * Find the best matching text line for a given name.
 * Tries exact match, then substring, then token overlap.
 *
 * @param {string} name - Name to search for (from Gemini)
 * @param {Array<{ text: string, bbox: object, center: { x: number, y: number } }>} textLines - OCR results
 * @returns {{ text: string, bbox: object, center: { x: number, y: number } } | null}
 */
export function findBestTextMatch(name, textLines) {
  if (!name || !textLines || textLines.length === 0) return null;

  const normalizedName = name.toLowerCase().trim();
  const nameTokens = normalizedName.split(/\s+/);

  let bestMatch = null;
  let bestScore = 0;

  for (const line of textLines) {
    const normalizedLine = line.text.toLowerCase().trim();

    // Exact match — score 100
    if (normalizedLine === normalizedName) {
      return line;
    }

    // Substring: name contained in line text
    if (normalizedLine.includes(normalizedName)) {
      const score = 90;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = line;
      }
      continue;
    }

    // Substring: line text contained in name
    if (normalizedName.includes(normalizedLine) && normalizedLine.length > 2) {
      const score = 80;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = line;
      }
      continue;
    }

    // Token overlap: count how many name tokens appear in the line
    const lineTokens = normalizedLine.split(/\s+/);
    let matchingTokens = 0;
    for (const token of nameTokens) {
      if (token.length < 2) continue;
      if (lineTokens.some((lt) => lt.includes(token) || token.includes(lt))) {
        matchingTokens++;
      }
    }

    if (matchingTokens > 0 && nameTokens.length > 0) {
      const score = (matchingTokens / nameTokens.length) * 70;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = line;
      }
    }
  }

  // Only return if we have a reasonable match (at least one token matched)
  if (bestScore >= 35) {
    return bestMatch;
  }

  return null;
}
