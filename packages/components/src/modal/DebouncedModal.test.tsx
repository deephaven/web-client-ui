import React from 'react';
import { DEFAULT_DEBOUNCE_MS } from '@deephaven/react-hooks';
import { act, render, screen } from '@testing-library/react';
import DebouncedModal from './DebouncedModal';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('display modal after debounce', () => {
  it('should render the modal after the debounce time has passed', () => {
    const mockChildText = 'Mock Child';
    const children = <div>{mockChildText}</div>;
    const { rerender } = render(
      <DebouncedModal isOpen={false}>{children}</DebouncedModal>
    );
    expect(screen.queryByTestId('debounced-modal-backdrop')).toBeNull();
    expect(screen.queryByText(mockChildText)).toBeNull();

    act(() => {
      rerender(<DebouncedModal isOpen>{children}</DebouncedModal>);
    });
    expect(screen.queryByTestId('debounced-modal-backdrop')).not.toBeNull();
    expect(screen.queryByText(mockChildText)).toBeNull();

    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(screen.queryByTestId('debounced-modal-backdrop')).not.toBeNull();
    expect(screen.queryByText(mockChildText)).not.toBeNull();
  });

  it('should not block interaction if set to false', () => {
    const mockChildText = 'Mock Child';
    const children = <div>{mockChildText}</div>;
    const { rerender } = render(
      <DebouncedModal isOpen={false} blockInteraction={false}>
        {children}
      </DebouncedModal>
    );
    expect(screen.queryByTestId('debounced-modal-backdrop')).toBeNull();
    expect(screen.queryByText(mockChildText)).toBeNull();

    act(() => {
      rerender(
        <DebouncedModal isOpen blockInteraction={false}>
          {children}
        </DebouncedModal>
      );
    });
    expect(screen.queryByTestId('debounced-modal-backdrop')).toBeNull();
    expect(screen.queryByText(mockChildText)).toBeNull();

    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS + 5);
    });
    expect(screen.queryByTestId('debounced-modal-backdrop')).toBeNull();
    expect(screen.queryByText(mockChildText)).not.toBeNull();
  });
});
