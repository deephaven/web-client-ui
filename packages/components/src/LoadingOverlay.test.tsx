import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders loading spinner and scrim when isLoading is true', () => {
    const { container } = render(
      <LoadingOverlay isLoading data-testid="test-overlay" />
    );
    expect(screen.getByTestId('test-overlay-spinner')).toBeInTheDocument();
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(1);
  });

  it('renders error message and scrim when errorMessage is provided', () => {
    const errorMessage = 'An error occurred';
    const { container } = render(
      <LoadingOverlay errorMessage={errorMessage} />
    );
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(1);
  });

  it('does not render scrim when loaded', () => {
    const { container } = render(<LoadingOverlay isLoaded />);
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(0);
  });
});
