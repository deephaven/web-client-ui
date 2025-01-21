import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '@deephaven/components';
import type { Container, EventEmitter } from '@deephaven/golden-layout';
import { TestUtils } from '@deephaven/test-utils';
import PanelErrorBoundary from './PanelErrorBoundary';
import PanelEvent from './PanelEvent';
import LayoutUtils from './layout/LayoutUtils';

jest.mock('@deephaven/components', () => ({
  LoadingOverlay: jest.fn(() => null),
}));

jest.mock('./layout/LayoutUtils', () => ({
  getIdFromContainer: jest.fn(),
}));

describe('PanelErrorBoundary', () => {
  const mockPanelId = 'test-panel-id';
  const mockGlContainer = {
    // Add minimal container implementation
    on: jest.fn(),
    off: jest.fn(),
  } as unknown as Container;

  const mockGlEventHub = {
    emit: jest.fn(),
  } as unknown as EventEmitter;

  const TestChild = function TestChildComponent() {
    return <div>Test Child Content</div>;
  };
  const ErrorChild = () => {
    throw new Error('Test error');
  };

  beforeAll(() => {
    TestUtils.disableConsoleOutput();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (LayoutUtils.getIdFromContainer as jest.Mock).mockReturnValue(mockPanelId);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <PanelErrorBoundary
        glContainer={mockGlContainer}
        glEventHub={mockGlEventHub}
      >
        <TestChild />
      </PanelErrorBoundary>
    );

    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('renders error overlay when there is an error', () => {
    render(
      <PanelErrorBoundary
        glContainer={mockGlContainer}
        glEventHub={mockGlEventHub}
      >
        <ErrorChild />
      </PanelErrorBoundary>
    );

    expect(LoadingOverlay).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Error: Test error',
        isLoading: false,
        isLoaded: false,
      }),
      expect.any(Object)
    );
  });

  it('emits CLOSED event on unmount', () => {
    const { unmount } = render(
      <PanelErrorBoundary
        glContainer={mockGlContainer}
        glEventHub={mockGlEventHub}
      >
        <TestChild />
      </PanelErrorBoundary>
    );

    unmount();

    expect(mockGlEventHub.emit).toHaveBeenCalledWith(
      PanelEvent.CLOSED,
      mockPanelId,
      mockGlContainer
    );
  });

  it('should not throw if children are undefined', () => {
    expect(() =>
      render(
        <PanelErrorBoundary
          glContainer={mockGlContainer}
          glEventHub={mockGlEventHub}
        >
          {undefined}
        </PanelErrorBoundary>
      )
    ).not.toThrow();
  });
});
