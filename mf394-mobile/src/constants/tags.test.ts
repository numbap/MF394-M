/**
 * Tests for tag constants
 */

import { AVAILABLE_TAGS } from './tags';

describe('Tag Constants', () => {
  describe('AVAILABLE_TAGS', () => {
    it('should export an array of tags', () => {
      expect(Array.isArray(AVAILABLE_TAGS)).toBe(true);
      expect(AVAILABLE_TAGS.length).toBeGreaterThan(0);
    });

    it('should contain expected tags', () => {
      const expectedTags = [
        'friend',
        'family',
        'work-colleague',
        'mentor',
        'student',
        'neighbor',
        'volunteer',
        'teammate',
      ];

      expect(AVAILABLE_TAGS).toEqual(expectedTags);
    });

    it('should contain exactly 8 tags', () => {
      expect(AVAILABLE_TAGS).toHaveLength(8);
    });

    it('should have unique tags', () => {
      const uniqueTags = new Set(AVAILABLE_TAGS);
      expect(uniqueTags.size).toBe(AVAILABLE_TAGS.length);
    });

    it('should have all tags as non-empty strings', () => {
      AVAILABLE_TAGS.forEach((tag) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
        expect(tag.trim()).toBe(tag); // No leading/trailing whitespace
      });
    });

    it('should use kebab-case for multi-word tags', () => {
      const multiWordTags = AVAILABLE_TAGS.filter((tag) => tag.includes('-'));
      expect(multiWordTags.length).toBeGreaterThan(0);

      multiWordTags.forEach((tag) => {
        // Should not have spaces
        expect(tag).not.toContain(' ');
        // Should not have underscores
        expect(tag).not.toContain('_');
        // Should be lowercase
        expect(tag).toBe(tag.toLowerCase());
      });
    });

    it('should be lowercase', () => {
      AVAILABLE_TAGS.forEach((tag) => {
        expect(tag).toBe(tag.toLowerCase());
      });
    });

    describe('Individual Tags', () => {
      it('should include friend tag', () => {
        expect(AVAILABLE_TAGS).toContain('friend');
      });

      it('should include family tag', () => {
        expect(AVAILABLE_TAGS).toContain('family');
      });

      it('should include work-colleague tag', () => {
        expect(AVAILABLE_TAGS).toContain('work-colleague');
      });

      it('should include mentor tag', () => {
        expect(AVAILABLE_TAGS).toContain('mentor');
      });

      it('should include student tag', () => {
        expect(AVAILABLE_TAGS).toContain('student');
      });

      it('should include neighbor tag', () => {
        expect(AVAILABLE_TAGS).toContain('neighbor');
      });

      it('should include volunteer tag', () => {
        expect(AVAILABLE_TAGS).toContain('volunteer');
      });

      it('should include teammate tag', () => {
        expect(AVAILABLE_TAGS).toContain('teammate');
      });
    });

    describe('Immutability', () => {
      it('should not allow modification of AVAILABLE_TAGS array', () => {
        const originalLength = AVAILABLE_TAGS.length;
        const originalFirst = AVAILABLE_TAGS[0];

        // This test verifies the array is frozen or treated as immutable
        // In TypeScript with const, this should be caught at compile time
        expect(() => {
          (AVAILABLE_TAGS as any).push('new-tag');
        }).toThrow();

        expect(AVAILABLE_TAGS.length).toBe(originalLength);
        expect(AVAILABLE_TAGS[0]).toBe(originalFirst);
      });
    });

    describe('Tag Validation', () => {
      it('should not contain special characters except hyphens', () => {
        const specialCharsRegex = /[^a-z0-9-]/;
        AVAILABLE_TAGS.forEach((tag) => {
          expect(tag).not.toMatch(specialCharsRegex);
        });
      });

      it('should not start or end with hyphens', () => {
        AVAILABLE_TAGS.forEach((tag) => {
          expect(tag.startsWith('-')).toBe(false);
          expect(tag.endsWith('-')).toBe(false);
        });
      });

      it('should not have consecutive hyphens', () => {
        AVAILABLE_TAGS.forEach((tag) => {
          expect(tag).not.toContain('--');
        });
      });
    });
  });
});
