import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OnboardingSlide } from './OnboardingSlide';

const baseProps = {
  image: 'https://example.com/slide.png',
  header: 'Welcome to the app',
  body: 'Discover amazing features',
  buttonText: 'Next',
  showSkip: true,
  isLast: false,
  onNext: jest.fn(),
  onSkip: jest.fn(),
};

describe('OnboardingSlide', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders header and body text', () => {
    const { getByText } = render(<OnboardingSlide {...baseProps} />);
    expect(getByText('Welcome to the app')).toBeTruthy();
    expect(getByText('Discover amazing features')).toBeTruthy();
  });

  it('renders the CTA button with correct label', () => {
    const { getByText } = render(<OnboardingSlide {...baseProps} />);
    expect(getByText('Next')).toBeTruthy();
  });

  it('calls onNext when button is pressed', () => {
    const { getByText } = render(<OnboardingSlide {...baseProps} />);
    fireEvent.press(getByText('Next'));
    expect(baseProps.onNext).toHaveBeenCalledTimes(1);
  });

  it('shows Skip button when showSkip=true', () => {
    const { getByText } = render(<OnboardingSlide {...baseProps} showSkip />);
    expect(getByText('Skip')).toBeTruthy();
  });

  it('hides Skip button when showSkip=false', () => {
    const { queryByText } = render(
      <OnboardingSlide {...baseProps} showSkip={false} />
    );
    expect(queryByText('Skip')).toBeNull();
  });

  it('calls onSkip when Skip is pressed', () => {
    const { getByText } = render(<OnboardingSlide {...baseProps} showSkip />);
    fireEvent.press(getByText('Skip'));
    expect(baseProps.onSkip).toHaveBeenCalledTimes(1);
  });

  it('renders last slide button text correctly', () => {
    const { getByText } = render(
      <OnboardingSlide {...baseProps} buttonText="Get Started" isLast />
    );
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('shows placeholder when image fails to load', () => {
    const { getByLabelText, getByTestId } = render(
      <OnboardingSlide {...baseProps} />
    );
    const image = getByTestId('onboarding-slide-image');
    fireEvent(image, 'onError');
    expect(getByLabelText('Slide image unavailable')).toBeTruthy();
  });

  it('disables button when transitioning is true', () => {
    const { getByLabelText } = render(
      <OnboardingSlide {...baseProps} transitioning />
    );
    const button = getByLabelText('Next');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('enables button when transitioning is false', () => {
    const { getByLabelText } = render(
      <OnboardingSlide {...baseProps} transitioning={false} />
    );
    const button = getByLabelText('Next');
    expect(button.props.accessibilityState?.disabled).toBeFalsy();
  });
});
