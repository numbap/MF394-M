import { mapCategoryToAPI, mapCategoryFromAPI } from './categoryMapper';

describe('categoryMapper', () => {
  describe('mapCategoryToAPI', () => {
    it('maps friends-family to Family', () => {
      expect(mapCategoryToAPI('friends-family')).toBe('Family');
    });

    it('maps community to Community', () => {
      expect(mapCategoryToAPI('community')).toBe('Community');
    });

    it('maps work to Work', () => {
      expect(mapCategoryToAPI('work')).toBe('Work');
    });

    it('maps goals-hobbies to Pursuits', () => {
      expect(mapCategoryToAPI('goals-hobbies')).toBe('Pursuits');
    });

    it('maps miscellaneous to Miscellaneous', () => {
      expect(mapCategoryToAPI('miscellaneous')).toBe('Miscellaneous');
    });

    it('returns Miscellaneous for unknown category', () => {
      expect(mapCategoryToAPI('unknown-category')).toBe('Miscellaneous');
    });
  });

  describe('mapCategoryFromAPI', () => {
    it('maps Family to friends-family', () => {
      expect(mapCategoryFromAPI('Family')).toBe('friends-family');
    });

    it('maps Community to community', () => {
      expect(mapCategoryFromAPI('Community')).toBe('community');
    });

    it('maps Work to work', () => {
      expect(mapCategoryFromAPI('Work')).toBe('work');
    });

    it('maps Pursuits to goals-hobbies', () => {
      expect(mapCategoryFromAPI('Pursuits')).toBe('goals-hobbies');
    });

    it('maps Miscellaneous to miscellaneous', () => {
      expect(mapCategoryFromAPI('Miscellaneous')).toBe('miscellaneous');
    });

    it('returns miscellaneous for unknown API category', () => {
      expect(mapCategoryFromAPI('Unknown')).toBe('miscellaneous');
    });
  });
});
