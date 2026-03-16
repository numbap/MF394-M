import React from 'react';
import { render } from '@testing-library/react-native';
import { OnboardingDots } from './OnboardingDots';

describe('OnboardingDots', () => {
  it('renders the correct number of dots', () => {
    const { getByLabelText } = render(<OnboardingDots total={6} current={0} />);
    expect(getByLabelText('Slide 1 of 6')).toBeTruthy();
  });

  it('shows accessibility label for current slide', () => {
    const { getByLabelText } = render(<OnboardingDots total={6} current={3} />);
    expect(getByLabelText('Slide 4 of 6')).toBeTruthy();
  });

  it('renders without crashing for single slide', () => {
    const { getByLabelText } = render(<OnboardingDots total={1} current={0} />);
    expect(getByLabelText('Slide 1 of 1')).toBeTruthy();
  });

  it('renders without crashing on last slide', () => {
    const { getByLabelText } = render(<OnboardingDots total={6} current={5} />);
    expect(getByLabelText('Slide 6 of 6')).toBeTruthy();
  });
});
