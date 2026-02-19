import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { CategoryTagSelector } from './CategoryTagSelector';
import { CATEGORIES, AVAILABLE_TAGS } from '../../constants';
import { renderWithRedux } from '../../../__tests__/utils/reduxTestUtils';

describe('CategoryTagSelector', () => {
  const defaultProps = {
    categories: CATEGORIES,
    selectedCategory: 'friends-family',
    onCategoryChange: jest.fn(),
    availableTags: AVAILABLE_TAGS,
    selectedTags: [],
    onTagsChange: jest.fn(),
  };

  it('renders CategorySelector and TagSelector', () => {
    const { getByText } = renderWithRedux(<CategoryTagSelector {...defaultProps} />, {
      preloadedState: {
        tags: { tags: AVAILABLE_TAGS },
      },
    });

    // Category label with required asterisk is rendered
    expect(getByText(/Category/)).toBeTruthy();
    expect(getByText('Tags')).toBeTruthy();
  });

  it('calls onCategoryChange when category is selected', () => {
    const onCategoryChange = jest.fn();
    const { getByText } = renderWithRedux(
      <CategoryTagSelector {...defaultProps} onCategoryChange={onCategoryChange} />,
      {
        preloadedState: {
          tags: { tags: AVAILABLE_TAGS },
        },
      }
    );

    // Open category selector
    const categoryButton = getByText('Friends & Family');
    fireEvent.press(categoryButton);

    // Select a category
    const workOption = getByText('Work');
    fireEvent.press(workOption);

    expect(onCategoryChange).toHaveBeenCalledWith('work');
  });

  it('calls onTagsChange when tag is toggled', () => {
    const onTagsChange = jest.fn();
    const { getByText } = renderWithRedux(
      <CategoryTagSelector
        {...defaultProps}
        availableTags={['Sports', 'Music']}
        onTagsChange={onTagsChange}
      />,
      {
        preloadedState: {
          tags: { tags: ['Sports', 'Music'] },
        },
      }
    );

    const sportsTag = getByText('Sports');
    fireEvent.press(sportsTag);

    expect(onTagsChange).toHaveBeenCalledWith(['Sports']);
  });

  it('shows Edit button when onEditTags is provided', () => {
    const onEditTags = jest.fn();
    const { getByText } = renderWithRedux(
      <CategoryTagSelector {...defaultProps} onEditTags={onEditTags} />,
      {
        preloadedState: {
          tags: { tags: AVAILABLE_TAGS },
        },
      }
    );

    const editButton = getByText('Edit');
    expect(editButton).toBeTruthy();

    fireEvent.press(editButton);
    expect(onEditTags).toHaveBeenCalled();
  });

  it('matches snapshot', () => {
    const { toJSON } = renderWithRedux(<CategoryTagSelector {...defaultProps} />, {
      preloadedState: {
        tags: { tags: AVAILABLE_TAGS },
      },
    });

    expect(toJSON()).toMatchSnapshot();
  });
});
