import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import OnboardingScreen from './OnboardingScreen';
import { useOnboarding } from '../../hooks/useOnboarding';

jest.mock('../../hooks/useOnboarding');

const mockUseOnboarding = useOnboarding as jest.Mock;

const mockScreens = [
  {
    image: 'https://example.com/s1.png',
    header: 'Welcome',
    body: 'Get started today',
    buttonText: 'Next',
    showSkip: true,
  },
  {
    image: 'https://example.com/s2.png',
    header: 'Step 2',
    body: 'Learn the ropes',
    buttonText: 'Next',
    showSkip: true,
  },
  {
    image: 'https://example.com/s3.png',
    header: 'Ready!',
    body: 'You are all set',
    buttonText: 'Get Started',
    showSkip: false,
  },
];

const mockGoNext = jest.fn();
const mockMarkComplete = jest.fn().mockResolvedValue(undefined);

const defaultMock = {
  isLoading: false,
  needsOnboarding: true,
  screens: mockScreens,
  currentIndex: 0,
  isLastSlide: false,
  transitioning: false,
  goNext: mockGoNext,
  markComplete: mockMarkComplete,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseOnboarding.mockReturnValue(defaultMock);
  jest.spyOn(Alert, 'alert');
});

describe('OnboardingScreen', () => {
  it('renders the first slide', () => {
    const { getByText } = render(<OnboardingScreen onComplete={jest.fn()} />);
    expect(getByText('Welcome')).toBeTruthy();
    expect(getByText('Get started today')).toBeTruthy();
  });

  it('calls goNext when Next is pressed on non-last slide', () => {
    const { getByText } = render(<OnboardingScreen onComplete={jest.fn()} />);
    fireEvent.press(getByText('Next'));
    expect(mockGoNext).toHaveBeenCalledTimes(1);
  });

  it('calls onComplete when Get Started pressed on last slide', () => {
    const onComplete = jest.fn();
    mockUseOnboarding.mockReturnValue({
      ...defaultMock,
      currentIndex: 2,
      isLastSlide: true,
      screens: mockScreens,
    });
    const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);
    fireEvent.press(getByText('Get Started'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows Alert when Skip is tapped', () => {
    const { getByText } = render(<OnboardingScreen onComplete={jest.fn()} />);
    fireEvent.press(getByText('Skip'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Skip tutorial?',
      "You won't be able to come back to this tutorial later.",
      expect.any(Array)
    );
  });

  it('calls onComplete when user confirms skip', () => {
    const onComplete = jest.fn();
    let capturedButtons: any[] = [];
    (Alert.alert as jest.Mock).mockImplementationOnce(
      (_title, _msg, buttons) => {
        capturedButtons = buttons;
      }
    );

    const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);
    fireEvent.press(getByText('Skip'));

    const yesSkip = capturedButtons.find((b) => b.text === 'Yes, skip');
    yesSkip?.onPress?.();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not call onComplete when cancel is pressed on skip dialog', () => {
    const onComplete = jest.fn();
    let capturedButtons: any[] = [];
    (Alert.alert as jest.Mock).mockImplementationOnce(
      (_title, _msg, buttons) => {
        capturedButtons = buttons;
      }
    );

    const { getByText } = render(<OnboardingScreen onComplete={onComplete} />);
    fireEvent.press(getByText('Skip'));

    const cancel = capturedButtons.find((b) => b.text === 'Cancel');
    cancel?.onPress?.();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('renders blank view when screens is empty', () => {
    mockUseOnboarding.mockReturnValue({ ...defaultMock, screens: [] });
    const { queryByText } = render(<OnboardingScreen onComplete={jest.fn()} />);
    expect(queryByText('Welcome')).toBeNull();
  });

  it('renders dot indicators', () => {
    const { getByLabelText } = render(<OnboardingScreen onComplete={jest.fn()} />);
    expect(getByLabelText('Slide 1 of 3')).toBeTruthy();
  });
});
