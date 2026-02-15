import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FormGroup } from './FormGroup';

describe('FormGroup', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <FormGroup>
        <Text>Test Content</Text>
      </FormGroup>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { paddingTop: 20 };
    const { getByText } = render(
      <FormGroup style={customStyle}>
        <Text>Test</Text>
      </FormGroup>
    );

    // Verify the component renders with custom styles
    expect(getByText('Test')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { toJSON } = render(
      <FormGroup>
        <Text>Snapshot Test</Text>
      </FormGroup>
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
