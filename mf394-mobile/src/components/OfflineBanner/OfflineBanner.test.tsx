import React from 'react';
import { render } from '@testing-library/react-native';
import { OfflineBanner } from './OfflineBanner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

jest.mock('../../hooks/useNetworkStatus');

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

describe('OfflineBanner', () => {
  it('renders when offline', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const { getByText } = render(<OfflineBanner />);
    expect(getByText('No internet connection')).toBeTruthy();
  });

  it('is hidden when online', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    const { queryByText } = render(<OfflineBanner />);
    expect(queryByText('No internet connection')).toBeNull();
  });

  it('shows the correct message', () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const { getByText } = render(<OfflineBanner />);
    expect(getByText('No internet connection')).toBeTruthy();
  });
});
