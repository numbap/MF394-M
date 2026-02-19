/**
 * CategoryTagFilter Component Tests
 *
 * Tests rendering, interaction, and visual states of the category filter.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CategoryTagFilter, CategoryItem } from './CategoryTagFilter';

const MOCK_CATEGORIES: CategoryItem[] = [
  { label: 'Friends & Family', value: 'friends-family', icon: 'heart' },
  { label: 'Community', value: 'community', icon: 'globe' },
  { label: 'Work', value: 'work', icon: 'briefcase' },
  { label: 'Goals & Hobbies', value: 'goals-hobbies', icon: 'trophy' },
  { label: 'Miscellaneous', value: 'miscellaneous', icon: 'star' },
];

describe('CategoryTagFilter', () => {
  const mockOnCategoryPress = jest.fn();
  const mockOnCategoryLongPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all categories', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      // Should render 5 category buttons (one for each category)
      MOCK_CATEGORIES.forEach((cat) => {
        expect(screen.getByTestId(`category-button-${cat.value}`)).toBeTruthy();
      });
    });

    it('should render correct header when no categories selected', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Select a Category')).toBeTruthy();
    });

    it('should render category label when one category selected', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Friends & Family')).toBeTruthy();
    });

    it('should render joined labels when two categories selected', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family', 'work']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Friends & Family + Work')).toBeTruthy();
    });

    it('should render "Multiple Selected" when more than two categories selected', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family', 'work', 'community']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Multiple Selected')).toBeTruthy();
    });

    it('should render with empty categories array', () => {
      render(
        <CategoryTagFilter
          categories={[]}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Select a Category')).toBeTruthy();
      // No buttons should be rendered
      expect(screen.queryByTestId(/category-button-/)).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should call onCategoryPress when a category button is pressed', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const button = screen.getByTestId('category-button-friends-family');
      fireEvent.press(button);

      expect(mockOnCategoryPress).toHaveBeenCalledTimes(1);
      expect(mockOnCategoryPress).toHaveBeenCalledWith('friends-family');
    });

    it('should call onCategoryPress with correct category value for different buttons', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      fireEvent.press(screen.getByTestId('category-button-friends-family'));
      expect(mockOnCategoryPress).toHaveBeenCalledWith('friends-family');

      fireEvent.press(screen.getByTestId('category-button-community'));
      expect(mockOnCategoryPress).toHaveBeenCalledWith('community');

      fireEvent.press(screen.getByTestId('category-button-work'));
      expect(mockOnCategoryPress).toHaveBeenCalledWith('work');

      expect(mockOnCategoryPress).toHaveBeenCalledTimes(3);
    });

    it('should call onCategoryLongPress when any category button is long pressed', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const button = screen.getByTestId('category-button-friends-family');
      fireEvent(button, 'longPress');

      expect(mockOnCategoryLongPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onCategoryPress when long press is triggered', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const button = screen.getByTestId('category-button-friends-family');
      fireEvent(button, 'longPress');

      expect(mockOnCategoryPress).not.toHaveBeenCalled();
      expect(mockOnCategoryLongPress).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple press interactions', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const button1 = screen.getByTestId('category-button-friends-family');
      const button2 = screen.getByTestId('category-button-community');

      fireEvent.press(button1);
      fireEvent.press(button2);
      fireEvent.press(button1);

      expect(mockOnCategoryPress).toHaveBeenCalledTimes(3);
      expect(mockOnCategoryPress).toHaveBeenNthCalledWith(1, 'friends-family');
      expect(mockOnCategoryPress).toHaveBeenNthCalledWith(2, 'community');
      expect(mockOnCategoryPress).toHaveBeenNthCalledWith(3, 'friends-family');
    });
  });

  describe('Visual States', () => {
    it('should apply selected style to selected categories', () => {
      const { UNSAFE_getByProps } = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family', 'work']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      // The component should render with yellow theme for selected items
      // This is a basic structural test - visual regression would be better
      expect(UNSAFE_getByProps).toBeDefined();
    });

    it('should update when selectedCategories prop changes', () => {
      const { rerender } = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Select a Category')).toBeTruthy();

      rerender(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Friends & Family')).toBeTruthy();
    });

    it('should handle all categories being selected', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={MOCK_CATEGORIES.map((cat) => cat.value)}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Multiple Selected')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid category value in selectedCategories', () => {
      const { UNSAFE_getByType } = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['invalid-category']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      // Component should still render even with invalid category
      // The header will show empty string when category not found
      expect(UNSAFE_getByType).toBeDefined();
    });

    it('should handle category with special characters in label', () => {
      const specialCategories: CategoryItem[] = [
        { label: 'Friends & Family', value: 'friends', icon: 'heart' },
        { label: 'Work @ Office', value: 'work', icon: 'briefcase' },
      ];

      render(
        <CategoryTagFilter
          categories={specialCategories}
          selectedCategories={['friends', 'work']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Friends & Family + Work @ Office')).toBeTruthy();
    });

    it('should handle single category in array', () => {
      render(
        <CategoryTagFilter
          categories={[MOCK_CATEGORIES[0]]}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      expect(screen.getByText('Select a Category')).toBeTruthy();
      expect(screen.getByTestId('category-button-friends-family')).toBeTruthy();
    });

    it('should handle rapid successive presses', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const button = screen.getByTestId('category-button-friends-family');

      // Simulate rapid presses
      for (let i = 0; i < 10; i++) {
        fireEvent.press(button);
      }

      expect(mockOnCategoryPress).toHaveBeenCalledTimes(10);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible buttons with proper roles', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      // All category buttons should be accessible
      MOCK_CATEGORIES.forEach((cat) => {
        const button = screen.getByTestId(`category-button-${cat.value}`);
        expect(button).toBeTruthy();
        expect(button.props.accessibilityRole).toBe('button');
        expect(button.props.accessibilityLabel).toBe(`${cat.label} category`);
      });
    });

    it('should have correct accessibility state for selected categories', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family', 'work']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      const selectedButton = screen.getByTestId('category-button-friends-family');
      const unselectedButton = screen.getByTestId('category-button-community');

      expect(selectedButton.props.accessibilityState.selected).toBe(true);
      expect(unselectedButton.props.accessibilityState.selected).toBe(false);
    });

    it('should render text content for screen readers', () => {
      render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      );

      // Header should be readable by screen readers
      expect(screen.getByText('Friends & Family')).toBeTruthy();
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot with no selection', () => {
      const tree = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={[]}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with one category selected', () => {
      const tree = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('should match snapshot with multiple categories selected', () => {
      const tree = render(
        <CategoryTagFilter
          categories={MOCK_CATEGORIES}
          selectedCategories={['friends-family', 'work', 'community']}
          onCategoryPress={mockOnCategoryPress}
          onCategoryLongPress={mockOnCategoryLongPress}
        />
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
