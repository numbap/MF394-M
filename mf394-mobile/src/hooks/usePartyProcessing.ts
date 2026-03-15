/**
 * usePartyProcessing — Unified face detection + OCR for Party Mode.
 *
 * Runs face detection and OCR in parallel for every image.
 * OCR names are matched to faces by proximity and returned as
 * prePopulatedNames so BulkNamer inputs can be pre-filled.
 * If no names are near faces, prePopulatedNames is empty and the
 * user types names manually — same as before.
 */
import { useState, useCallback } from 'react';
import { useFaceDetection } from './useFaceDetection';
import { ocrImage } from '../services/ocrService';
import { identifyNamesLocally } from '../services/nameMatch';
import { cropFaceWithBounds } from '../utils/imageCropping';
import { generateId } from '../utils/generateId';

export type ProcessedFace = { id: string; uri: string };
export type PrePopulatedName = { id: string; name: string; faceUri: string };

type ProcessResult = {
  detectedFaces: ProcessedFace[];
  prePopulatedNames: PrePopulatedName[];
};

export function usePartyProcessing() {
  const { detectFaces } = useFaceDetection();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = useCallback(
    async (uri: string): Promise<ProcessResult> => {
      setIsProcessing(true);
      setError(null);

      try {
        // Run face detection and OCR in parallel
        const [faceResult, ocrLines] = await Promise.all([
          detectFaces(uri),
          ocrImage(uri).catch((err) => {
            console.error('[usePartyProcessing] OCR failed:', err?.message, err);
            return [];
          }),
        ]);

        const rawFaces = faceResult?.faces || [];
        console.log(`[usePartyProcessing] faces=${rawFaces.length}, ocrLines=${ocrLines.length}`);

        // Crop each detected face
        const detectedFaces: ProcessedFace[] = await Promise.all(
          rawFaces.map(async (face: any) => {
            const faceId = face.id || generateId();
            if (!face.bounds) return { id: faceId, uri };
            try {
              const croppedUri = await cropFaceWithBounds(uri, face.bounds);
              return { id: faceId, uri: croppedUri };
            } catch {
              return { id: faceId, uri };
            }
          })
        );

        let prePopulatedNames: PrePopulatedName[] = [];

        if (ocrLines.length > 0 && rawFaces.length > 0) {
          // Convert face bounds to the format nameMatch expects
          const facesForMatching = rawFaces.map((face: any) => ({
            id: face.id || generateId(),
            boundingBox: face.bounds
              ? {
                  x: face.bounds.origin.x,
                  y: face.bounds.origin.y,
                  width: face.bounds.size.width,
                  height: face.bounds.size.height,
                }
              : { x: 0, y: 0, width: 0, height: 0 },
          }));

          const { matches } = identifyNamesLocally(ocrLines, facesForMatching);

          prePopulatedNames = matches.map((match: any) => {
            const pf = detectedFaces.find((f) => f.id === match.faceId);
            return {
              id: match.faceId,
              name: match.name,
              faceUri: pf?.uri || uri,
            };
          });
        }

        return { detectedFaces, prePopulatedNames };
      } catch (err: any) {
        const message = err?.message || 'Processing failed';
        setError(message);
        throw err;
      } finally {
        setIsProcessing(false);
      }
    },
    [detectFaces]
  );

  return { process, isProcessing, error };
}
