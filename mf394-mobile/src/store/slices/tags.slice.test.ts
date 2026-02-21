/**
 * Tags Slice Tests
 */

import tagsReducer, { addTag, deleteTag, initializeTags, selectAllTags, selectTagExists } from './tags.slice';
import { AVAILABLE_TAGS } from '../../constants/tags';
import { RootState } from '../index';

describe('tags.slice', () => {
  describe('reducers', () => {
    it('should initialize with AVAILABLE_TAGS', () => {
      const state = tagsReducer(undefined, { type: 'unknown' });
      expect(state.tags).toEqual([...AVAILABLE_TAGS]);
    });

    it('should add a new tag (prepended to beginning)', () => {
      const initialState = { tags: ['friend', 'family'] };
      const state = tagsReducer(initialState, addTag('MENTOR'));
      expect(state.tags).toEqual(['MENTOR', 'friend', 'family']);
    });

    it('should normalize tag to uppercase', () => {
      const initialState = { tags: ['friend'] };
      const state = tagsReducer(initialState, addTag('Work-Colleague'));
      expect(state.tags).toContain('WORK-COLLEAGUE');
    });

    it('should trim whitespace when adding tag', () => {
      const initialState = { tags: ['friend'] };
      const state = tagsReducer(initialState, addTag('  MENTOR  '));
      expect(state.tags).toContain('MENTOR');
    });

    it('should prevent duplicate tags (case-insensitive)', () => {
      const initialState = { tags: ['friend', 'family'] };
      // 'Friend' normalizes to 'FRIEND', which matches existing 'friend' case-insensitively
      const state = tagsReducer(initialState, addTag('Friend'));
      expect(state.tags).toEqual(['friend', 'family']); // No duplicate added
    });

    it('should delete a tag', () => {
      const initialState = { tags: ['friend', 'family', 'mentor'] };
      const state = tagsReducer(initialState, deleteTag('family'));
      expect(state.tags).toEqual(['friend', 'mentor']);
    });

    it('should handle deleting non-existent tag', () => {
      const initialState = { tags: ['friend', 'family'] };
      const state = tagsReducer(initialState, deleteTag('nonexistent'));
      expect(state.tags).toEqual(['friend', 'family']); // No change
    });

    it('should reset to AVAILABLE_TAGS on initialize', () => {
      const initialState = { tags: ['custom-tag'] };
      const state = tagsReducer(initialState, initializeTags());
      expect(state.tags).toEqual([...AVAILABLE_TAGS]);
    });

    it('should allow empty tags array after deleting all', () => {
      const initialState = { tags: ['friend'] };
      const state = tagsReducer(initialState, deleteTag('friend'));
      expect(state.tags).toEqual([]);
    });
  });

  describe('selectors', () => {
    const mockState: Partial<RootState> = {
      tags: {
        tags: ['friend', 'family', 'mentor'],
      },
    };

    it('should select all tags', () => {
      const tags = selectAllTags(mockState as RootState);
      expect(tags).toEqual(['friend', 'family', 'mentor']);
    });

    it('should check if tag exists (case-insensitive)', () => {
      const existsSelector = selectTagExists('Friend');
      expect(existsSelector(mockState as RootState)).toBe(true);
    });

    it('should return false for non-existent tag', () => {
      const existsSelector = selectTagExists('nonexistent');
      expect(existsSelector(mockState as RootState)).toBe(false);
    });

    it('should handle empty tags array', () => {
      const emptyState: Partial<RootState> = {
        tags: { tags: [] },
      };
      const tags = selectAllTags(emptyState as RootState);
      expect(tags).toEqual([]);
    });
  });
});
