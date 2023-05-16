import React from 'react';
import { act, render, screen } from '@testing-library/react';
import DebouncedModal from './DebouncedModal';
import Modal from './Modal';

const mockChildText = 'Mock Child';
const children = (
  <Modal>
    <div>{mockChildText}</div>
  </Modal>
);
const DEFAULT_DEBOUNCE_MS = 250;

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('display modal after debounce', () => {
  it('should render the modal after the debounce time has passed', () => {
    const { rerender } = render(
      <DebouncedModal isOpen={false} debounceMs={DEFAULT_DEBOUNCE_MS}>
        {children}
      </DebouncedModal>
    );
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();

    act(() => {
      rerender(
        <DebouncedModal isOpen debounceMs={DEFAULT_DEBOUNCE_MS}>
          {children}
        </DebouncedModal>
      );
    });
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).toBeInTheDocument();
  });

  it('should not block interaction if set to false', () => {
    const { rerender } = render(
      <DebouncedModal
        isOpen={false}
        blockInteraction={false}
        debounceMs={DEFAULT_DEBOUNCE_MS}
      >
        {children}
      </DebouncedModal>
    );
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();

    act(() => {
      rerender(
        <DebouncedModal
          isOpen
          blockInteraction={false}
          debounceMs={DEFAULT_DEBOUNCE_MS}
        >
          {children}
        </DebouncedModal>
      );
    });
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS + 5);
    });
    expect(
      screen.queryByTestId('debounced-modal-backdrop')
    ).not.toBeInTheDocument();
    expect(screen.queryByText(mockChildText)).toBeInTheDocument();
  });
});
