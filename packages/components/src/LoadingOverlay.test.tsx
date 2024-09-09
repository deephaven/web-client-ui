import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingOverlay from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders loading spinner and no scrim on initial loading', () => {
    const { container } = render(
      <LoadingOverlay isLoading data-testid="test-overlay" />
    );
    expect(screen.getByTestId('test-overlay-spinner')).toBeInTheDocument();
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(0);
  });

  it('renders error message and no scrim when errorMessage is provided on initial loading', () => {
    const errorMessage = 'An error occurred';
    const { container } = render(
      <LoadingOverlay errorMessage={errorMessage} />
    );
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(0);
  });

  it('renders scrim when loaded and errorMessage is provided', () => {
    const { container } = render(
      <LoadingOverlay isLoaded errorMessage="ERROR_MESSAGE" />
    );
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(1);
  });

  it('renders scrim when isLoaded is true and loading again', () => {
    const { container } = render(<LoadingOverlay isLoaded isLoading />);
    expect(
      container.getElementsByClassName('iris-panel-scrim-background').length
    ).toBe(1);
  });
});
