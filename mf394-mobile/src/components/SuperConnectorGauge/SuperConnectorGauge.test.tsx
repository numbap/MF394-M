import React from 'react';
import { render } from '@testing-library/react-native';
import { SuperConnectorGauge } from './SuperConnectorGauge';

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createAnimatedComponent = (c: any) => c;
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent,
    },
    View,
    createAnimatedComponent,
    useSharedValue: jest.fn((val: any) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb: any) => cb()),
    useAnimatedProps: jest.fn((cb: any) => cb()),
    useDerivedValue: jest.fn((cb: any) => ({ value: cb() })),
    withTiming: jest.fn((val: any) => val),
    withDelay: jest.fn((_d: any, val: any) => val),
    withSequence: jest.fn((...args: any[]) => args[args.length - 1]),
    interpolateColor: jest.fn(() => '#eab308'),
    Easing: { out: jest.fn((e: any) => e), cubic: jest.fn() },
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Circle: (props: any) => React.createElement(View, props),
  };
});

describe('SuperConnectorGauge', () => {
  it('renders the contact count and max', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={15} />);
    expect(getByText('15')).toBeTruthy();
    expect(getByText('of 30')).toBeTruthy();
  });

  it('clamps values above maxCount', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={50} />);
    expect(getByText('30')).toBeTruthy();
  });

  it('clamps negative values to 0', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={-5} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('shows "Add your first contact!" at 0', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={0} />);
    expect(getByText('Add your first contact!')).toBeTruthy();
  });

  it('shows "Keep going!" for low counts', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={5} />);
    expect(getByText('Keep going!')).toBeTruthy();
  });

  it('shows "You\'re building momentum!" for mid counts', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={12} />);
    expect(getByText("You're building momentum!")).toBeTruthy();
  });

  it('shows "Almost there!" for high counts', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={25} />);
    expect(getByText('Almost there!')).toBeTruthy();
  });

  it('shows "Super-Connector!" at max', () => {
    const { getByText } = render(<SuperConnectorGauge contactCount={30} />);
    expect(getByText('Super-Connector!')).toBeTruthy();
  });

  it('respects custom maxCount', () => {
    const { getByText } = render(
      <SuperConnectorGauge contactCount={10} maxCount={20} />,
    );
    expect(getByText('of 20')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
  });

  it('has the gauge test ID', () => {
    const { getByTestId } = render(<SuperConnectorGauge contactCount={5} />);
    expect(getByTestId('super-connector-gauge')).toBeTruthy();
  });
});
