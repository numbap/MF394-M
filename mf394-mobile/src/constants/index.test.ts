/**
 * Tests for constants barrel export
 */

import * as Constants from './index';
import { CATEGORIES, DEFAULT_CATEGORY, type Category } from './categories';
import { AVAILABLE_TAGS } from './tags';

describe('Constants Barrel Export', () => {
  it('should export CATEGORIES', () => {
    expect(Constants.CATEGORIES).toBeDefined();
    expect(Constants.CATEGORIES).toBe(CATEGORIES);
  });

  it('should export DEFAULT_CATEGORY', () => {
    expect(Constants.DEFAULT_CATEGORY).toBeDefined();
    expect(Constants.DEFAULT_CATEGORY).toBe(DEFAULT_CATEGORY);
  });

  it('should export AVAILABLE_TAGS', () => {
    expect(Constants.AVAILABLE_TAGS).toBeDefined();
    expect(Constants.AVAILABLE_TAGS).toBe(AVAILABLE_TAGS);
  });

  it('should export Category type', () => {
    // Type check - will fail at compile time if type is not exported
    const testCategory: Constants.Category = {
      label: 'Test',
      value: 'test',
      icon: 'test-icon',
    };

    expect(testCategory).toHaveProperty('label');
    expect(testCategory).toHaveProperty('value');
    expect(testCategory).toHaveProperty('icon');
  });

  it('should have all expected exports', () => {
    const expectedExports = ['CATEGORIES', 'DEFAULT_CATEGORY', 'AVAILABLE_TAGS'];

    expectedExports.forEach((exportName) => {
      expect(Constants).toHaveProperty(exportName);
    });
  });

  it('should not have unexpected exports', () => {
    const expectedExports = ['CATEGORIES', 'DEFAULT_CATEGORY', 'AVAILABLE_TAGS'];
    const actualExports = Object.keys(Constants);

    // All actual exports should be in expected exports
    actualExports.forEach((exportName) => {
      expect(expectedExports).toContain(exportName);
    });
  });
});
