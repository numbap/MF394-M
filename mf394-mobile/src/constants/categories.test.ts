/**
 * Tests for category constants
 */

import { CATEGORIES, DEFAULT_CATEGORY, type Category } from './categories';

describe('Category Constants', () => {
  describe('CATEGORIES', () => {
    it('should export an array of categories', () => {
      expect(Array.isArray(CATEGORIES)).toBe(true);
      expect(CATEGORIES.length).toBeGreaterThan(0);
    });

    it('should contain exactly 5 categories', () => {
      expect(CATEGORIES).toHaveLength(5);
    });

    it('should have all required categories with correct icons', () => {
      const expectedCategories = [
        { label: 'Friends & Family', value: 'friends-family', icon: 'heart' },
        { label: 'Community', value: 'community', icon: 'globe' },
        { label: 'Work', value: 'work', icon: 'briefcase' },
        { label: 'Goals & Hobbies', value: 'goals-hobbies', icon: 'trophy' },
        { label: 'Miscellaneous', value: 'miscellaneous', icon: 'star' },
      ];

      expect(CATEGORIES).toEqual(expectedCategories);
    });

    it('should have Miscellaneous as the last category', () => {
      const lastCategory = CATEGORIES[CATEGORIES.length - 1];
      expect(lastCategory.value).toBe('miscellaneous');
      expect(lastCategory.icon).toBe('star');
    });

    it('should have unique category values', () => {
      const values = CATEGORIES.map((cat) => cat.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have unique category labels', () => {
      const labels = CATEGORIES.map((cat) => cat.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it('should have each category with label, value, and icon properties', () => {
      CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('icon');
        expect(typeof category.label).toBe('string');
        expect(typeof category.value).toBe('string');
        expect(typeof category.icon).toBe('string');
        expect(category.label.length).toBeGreaterThan(0);
        expect(category.value.length).toBeGreaterThan(0);
        expect(category.icon.length).toBeGreaterThan(0);
      });
    });

    describe('Icon Correctness', () => {
      it('should have heart icon for Friends & Family', () => {
        const category = CATEGORIES.find((cat) => cat.value === 'friends-family');
        expect(category?.icon).toBe('heart');
      });

      it('should have globe icon for Community', () => {
        const category = CATEGORIES.find((cat) => cat.value === 'community');
        expect(category?.icon).toBe('globe');
      });

      it('should have briefcase icon for Work', () => {
        const category = CATEGORIES.find((cat) => cat.value === 'work');
        expect(category?.icon).toBe('briefcase');
      });

      it('should have trophy icon for Goals & Hobbies', () => {
        const category = CATEGORIES.find((cat) => cat.value === 'goals-hobbies');
        expect(category?.icon).toBe('trophy');
      });

      it('should have star icon for Miscellaneous', () => {
        const category = CATEGORIES.find((cat) => cat.value === 'miscellaneous');
        expect(category?.icon).toBe('star');
      });
    });

    describe('Category Order', () => {
      it('should maintain the correct order', () => {
        const expectedOrder = [
          'friends-family',
          'community',
          'work',
          'goals-hobbies',
          'miscellaneous',
        ];

        const actualOrder = CATEGORIES.map((cat) => cat.value);
        expect(actualOrder).toEqual(expectedOrder);
      });
    });
  });

  describe('DEFAULT_CATEGORY', () => {
    it('should be defined', () => {
      expect(DEFAULT_CATEGORY).toBeDefined();
      expect(typeof DEFAULT_CATEGORY).toBe('string');
    });

    it('should be miscellaneous', () => {
      expect(DEFAULT_CATEGORY).toBe('miscellaneous');
    });

    it('should exist in CATEGORIES array', () => {
      const categoryExists = CATEGORIES.some((cat) => cat.value === DEFAULT_CATEGORY);
      expect(categoryExists).toBe(true);
    });

    it('should correspond to a valid category object', () => {
      const defaultCategoryObj = CATEGORIES.find((cat) => cat.value === DEFAULT_CATEGORY);
      expect(defaultCategoryObj).toBeDefined();
      expect(defaultCategoryObj?.label).toBe('Miscellaneous');
      expect(defaultCategoryObj?.icon).toBe('star');
    });
  });

  describe('Category Type', () => {
    it('should match the Category interface structure', () => {
      // Type check - this will fail at compile time if types don't match
      const testCategory: Category = {
        label: 'Test',
        value: 'test',
        icon: 'test-icon',
      };

      expect(testCategory).toHaveProperty('label');
      expect(testCategory).toHaveProperty('value');
      expect(testCategory).toHaveProperty('icon');
    });

    it('should allow CATEGORIES to be typed as Category[]', () => {
      // Type check - this will fail at compile time if types don't match
      const categories: Category[] = CATEGORIES;
      expect(categories).toBe(CATEGORIES);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of CATEGORIES array', () => {
      const originalLength = CATEGORIES.length;
      const originalFirst = { ...CATEGORIES[0] };

      // This test verifies the array is frozen or treated as immutable
      // In TypeScript with const, this should be caught at compile time
      expect(() => {
        (CATEGORIES as any).push({ label: 'Test', value: 'test', icon: 'test' });
      }).toThrow();

      expect(CATEGORIES.length).toBe(originalLength);
      expect(CATEGORIES[0]).toEqual(originalFirst);
    });
  });
});
