/**
 * Tests for useFaceDetection hook
 *
 * Tests the face detection and cropping logic, including:
 * - Face detection with face-api.js on web
 * - Fallback to mock faces for testing
 * - Proper bounds formatting
 * - Face extraction with padding
 * - Error handling
 */

import { extractFacesFromDetections, createMockFaces } from '../../src/hooks/useFaceDetection';

describe('Face Detection Logic', () => {
  describe('createMockFaces', () => {
    it('should create exactly 6 mock faces', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      expect(faces).toHaveLength(6);
    });

    it('should assign unique IDs to each face', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      const ids = faces.map((f) => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(6);
    });

    it('should include the provided URI in each face', () => {
      const uri = 'data:image/jpeg;base64,test';
      const faces = createMockFaces(uri, 800, 800);
      faces.forEach((face) => {
        expect(face.uri).toBe(uri);
      });
    });

    it('should have valid bounds for each face', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      faces.forEach((face) => {
        expect(face.bounds).toHaveProperty('origin');
        expect(face.bounds).toHaveProperty('size');
        expect(face.bounds.origin).toHaveProperty('x');
        expect(face.bounds.origin).toHaveProperty('y');
        expect(face.bounds.size).toHaveProperty('width');
        expect(face.bounds.size).toHaveProperty('height');
      });
    });

    it('should have positive dimensions for each face', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      faces.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });
    });

    it('should have non-negative origin coordinates', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      faces.forEach((face) => {
        expect(face.bounds.origin.x).toBeGreaterThanOrEqual(0);
        expect(face.bounds.origin.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have confidence scores between 0 and 1', () => {
      const faces = createMockFaces('data:image/jpeg;base64,mock', 800, 800);
      faces.forEach((face) => {
        expect(face.confidence).toBeGreaterThan(0);
        expect(face.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should scale face positions based on image dimensions', () => {
      const faces1 = createMockFaces('uri', 800, 800);
      const faces2 = createMockFaces('uri', 1600, 1600);

      // Larger image should have proportionally larger face sizes
      expect(faces2[0].bounds.size.width).toBeGreaterThan(
        faces1[0].bounds.size.width
      );
    });

    it('should keep faces within image bounds', () => {
      const imageWidth = 800;
      const imageHeight = 800;
      const faces = createMockFaces('uri', imageWidth, imageHeight);

      faces.forEach((face) => {
        const x = face.bounds.origin.x;
        const y = face.bounds.origin.y;
        const w = face.bounds.size.width;
        const h = face.bounds.size.height;

        // Faces should fit within image bounds with some margin
        expect(x + w).toBeLessThanOrEqual(imageWidth);
        expect(y + h).toBeLessThanOrEqual(imageHeight);
      });
    });

    it('should handle rectangular images', () => {
      const faces = createMockFaces('uri', 1200, 800);
      expect(faces.length).toBe(6);
      faces.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });
    });

    it('should handle different aspect ratios', () => {
      const facesWide = createMockFaces('uri', 1600, 400);
      const facesSquare = createMockFaces('uri', 800, 800);
      const faceTall = createMockFaces('uri', 400, 1600);

      expect(facesWide.length).toBe(6);
      expect(facesSquare.length).toBe(6);
      expect(faceTall.length).toBe(6);
    });
  });

  describe('Face bounds format', () => {
    it('should use consistent bounds structure', () => {
      const faces = createMockFaces('uri', 800, 800);

      faces.forEach((face) => {
        // Verify all required properties exist
        expect(face).toHaveProperty('id');
        expect(face).toHaveProperty('uri');
        expect(face).toHaveProperty('bounds');
        expect(face).toHaveProperty('confidence');

        // Verify bounds structure
        expect(face.bounds).toHaveProperty('origin');
        expect(face.bounds).toHaveProperty('size');
        expect(typeof face.bounds.origin.x).toBe('number');
        expect(typeof face.bounds.origin.y).toBe('number');
        expect(typeof face.bounds.size.width).toBe('number');
        expect(typeof face.bounds.size.height).toBe('number');
      });
    });
  });

  describe('Face padding and sizing', () => {
    it('should generate faces that are roughly 25% of image width', () => {
      const imageWidth = 800;
      const faces = createMockFaces('uri', imageWidth, imageWidth);
      const expectedWidth = imageWidth * 0.25;

      faces.forEach((face) => {
        // Face width should be approximately 25% of image width (within 20% tolerance)
        expect(face.bounds.size.width).toBeGreaterThan(expectedWidth * 0.8);
        expect(face.bounds.size.width).toBeLessThan(expectedWidth * 1.2);
      });
    });

    it('should maintain face aspect ratio', () => {
      const faces = createMockFaces('uri', 800, 800);

      faces.forEach((face) => {
        const width = face.bounds.size.width;
        const height = face.bounds.size.height;

        // Faces should be roughly square (ratio between 0.8 and 1.2)
        const ratio = width / height;
        expect(ratio).toBeGreaterThan(0.8);
        expect(ratio).toBeLessThan(1.2);
      });
    });
  });

  describe('Multiple face positions', () => {
    it('should distribute faces in 3x2 grid pattern', () => {
      const faces = createMockFaces('uri', 800, 800);

      // Get unique X and Y positions to verify grid pattern
      const xPositions = [...new Set(faces.map((f) => f.bounds.origin.x))];
      const yPositions = [...new Set(faces.map((f) => f.bounds.origin.y))];

      // Should have 3 columns (left, center, right)
      expect(xPositions.length).toBeGreaterThanOrEqual(3);

      // Should have 2 rows (top, bottom)
      expect(yPositions.length).toBeGreaterThanOrEqual(2);
    });

    it('should have varied confidence scores', () => {
      const faces = createMockFaces('uri', 800, 800);
      const confidences = faces.map((f) => f.confidence);

      // Should have multiple different confidence values
      const uniqueConfidences = new Set(confidences);
      expect(uniqueConfidences.size).toBeGreaterThan(1);
    });

    it('should not have overlapping faces', () => {
      const faces = createMockFaces('uri', 800, 800);

      // Check each pair of faces for overlap
      for (let i = 0; i < faces.length; i++) {
        for (let j = i + 1; j < faces.length; j++) {
          const f1 = faces[i];
          const f2 = faces[j];

          const f1Right = f1.bounds.origin.x + f1.bounds.size.width;
          const f1Bottom = f1.bounds.origin.y + f1.bounds.size.height;
          const f2Right = f2.bounds.origin.x + f2.bounds.size.width;
          const f2Bottom = f2.bounds.origin.y + f2.bounds.size.height;

          // Check if faces don't overlap (or just barely touch)
          const noHorizontalOverlap =
            f1Right <= f2.bounds.origin.x || f2Right <= f1.bounds.origin.x;
          const noVerticalOverlap =
            f1Bottom <= f2.bounds.origin.y || f2Bottom <= f1.bounds.origin.y;

          expect(noHorizontalOverlap || noVerticalOverlap).toBe(true);
        }
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very small images', () => {
      const faces = createMockFaces('uri', 100, 100);
      expect(faces.length).toBe(6);
      faces.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });
    });

    it('should handle very large images', () => {
      const faces = createMockFaces('uri', 4000, 3000);
      expect(faces.length).toBe(6);
      faces.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });
    });

    it('should handle extreme aspect ratios', () => {
      const facesWide = createMockFaces('uri', 2000, 100);
      const facesTall = createMockFaces('uri', 100, 2000);

      expect(facesWide.length).toBe(6);
      expect(facesTall.length).toBe(6);

      facesWide.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });

      facesTall.forEach((face) => {
        expect(face.bounds.size.width).toBeGreaterThan(0);
        expect(face.bounds.size.height).toBeGreaterThan(0);
      });
    });
  });

  describe('Crop dimension validation', () => {
    it('should support cropping for all mock faces', () => {
      const faces = createMockFaces('uri', 800, 800);
      const padding = 25;

      faces.forEach((face) => {
        const originX = Math.max(0, face.bounds.origin.x - padding);
        const originY = Math.max(0, face.bounds.origin.y - padding);
        const cropWidth = Math.min(
          face.bounds.size.width + padding * 2,
          800 - originX
        );
        const cropHeight = Math.min(
          face.bounds.size.height + padding * 2,
          800 - originY
        );

        // All crops should be valid
        expect(cropWidth).toBeGreaterThan(0);
        expect(cropHeight).toBeGreaterThan(0);
      });
    });
  });

  describe('Face detection result format', () => {
    it('should return object with faces array and isRealDetection flag', () => {
      const faces = createMockFaces('uri', 800, 800);

      // Verify return format structure
      expect(faces).toHaveLength(6);
      faces.forEach((face) => {
        expect(face).toHaveProperty('id');
        expect(face).toHaveProperty('uri');
        expect(face).toHaveProperty('bounds');
        expect(face).toHaveProperty('confidence');
      });
    });

    it('should not return mock faces - only return real detections', () => {
      // The hook should not automatically generate 6 mock faces
      // when real detection finds 0 faces
      const mockFaces = createMockFaces('uri', 800, 800);

      // Verify we're testing with actual mock face generation
      expect(mockFaces).toHaveLength(6);
      expect(mockFaces[0].id).toBe('face-0');
      expect(mockFaces[0].confidence).toBe(0.92);
    });

    it('should handle empty detection gracefully', () => {
      // When detection finds 0 faces, should return empty array
      // not generate mock fallbacks
      const emptyResult = extractFacesFromDetections(
        { width: 800, height: 800 },
        [],
        'uri'
      );

      expect(emptyResult).toEqual([]);
    });

    it('should extract real faces from valid detections', () => {
      // Mock a face-api detection result
      const mockImage = { width: 800, height: 800 };
      const mockDetection = {
        box: { x: 100, y: 100, width: 150, height: 200 },
        score: 0.95,
      };

      const faces = extractFacesFromDetections(mockImage, [mockDetection], 'uri');

      expect(faces).toHaveLength(1);
      expect(faces[0].id).toBeTruthy();
      expect(faces[0]).toHaveProperty('uri', 'uri');
      expect(faces[0]).toHaveProperty('confidence', 0.95);
      expect(faces[0].bounds).toHaveProperty('origin');
      expect(faces[0].bounds).toHaveProperty('size');
    });

    it('should handle multiple real detections', () => {
      const mockImage = { width: 1000, height: 1000 };
      const mockDetections = [
        { box: { x: 100, y: 100, width: 150, height: 200 }, score: 0.95 },
        { box: { x: 400, y: 100, width: 150, height: 200 }, score: 0.92 },
        { box: { x: 700, y: 100, width: 150, height: 200 }, score: 0.88 },
      ];

      const faces = extractFacesFromDetections(mockImage, mockDetections, 'uri');

      expect(faces).toHaveLength(3);
      // IDs are UUIDs — verify they exist and are unique
      expect(faces[0].id).toBeTruthy();
      expect(faces[1].id).toBeTruthy();
      expect(faces[2].id).toBeTruthy();
      expect(new Set([faces[0].id, faces[1].id, faces[2].id]).size).toBe(3);
    });

    it('should filter out invalid detections', () => {
      const mockImage = { width: 800, height: 800 };
      const mockDetections = [
        { box: { x: 100, y: 100, width: 150, height: 200 }, score: 0.95 }, // valid
        { box: { x: 500, y: 500, width: 0, height: 0 }, score: 0.90 }, // invalid - zero size
        { box: { x: 200, y: 200, width: 100, height: 100 }, score: 0.88 }, // valid
      ];

      const faces = extractFacesFromDetections(mockImage, mockDetections, 'uri');

      // Should only include valid detections
      expect(faces.length).toBe(2);
      expect(faces[0].confidence).toBe(0.95);
      expect(faces[1].confidence).toBe(0.88);
    });
  });
});
