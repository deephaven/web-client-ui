import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from './Modal';

function makeModal({
  className,
  children,
  keyboard,
  isOpen,
  centered,
  onOpened,
  toggle,
  'data-testid': dataTestId,
}: {
  className?: string;
  children?;
  keyboard?: boolean;
  isOpen?: boolean;
  centered?: boolean;
  onOpened?: () => void;
  toggle?: () => void;
  'data-testid'?: string;
}) {
  return (
    <Modal
      className={className}
      keyboard={keyboard}
      isOpen={isOpen}
      centered={centered}
      onOpened={onOpened}
      toggle={toggle}
    >
      {children}
    </Modal>
  );
}

it('mounts', () => {
  render(makeModal({}));
});

it('does not render when isOpen is false', () => {
  render(makeModal({ isOpen: false }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('renders when isOpen is true', async () => {
  render(makeModal({ isOpen: true }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('renders when isOpen changes', async () => {
  jest.useFakeTimers();

  const { rerender } = render(makeModal({ isOpen: false }));

  expect(screen.queryByRole('dialog')).toBeNull();
  rerender(makeModal({ isOpen: true }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  rerender(makeModal({ isOpen: false }));

  // It will fade out, so it will still be visible until the animation is complete
  expect(screen.queryByRole('dialog')).toBeInTheDocument();
  jest.runAllTimers();
  jest.useRealTimers(); // Reset so other tests don't use fake timers
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('calls toggle when esc key is pressed', () => {
  const toggle = jest.fn();
  const { container } = render(
    makeModal({ isOpen: true, keyboard: true, toggle })
  );
  fireEvent.keyDown(container, { key: 'Escape' });
  expect(toggle).toBeCalledTimes(1);
});

it('does not calls toggle when esc key is pressed when keyboard is false', () => {
  const toggle = jest.fn();

  const { container } = render(
    makeModal({ isOpen: true, keyboard: false, toggle })
  );
  fireEvent.keyDown(container, { key: 'Escape' });
  expect(toggle).toBeCalledTimes(0);
});

it('closes only when clicking outside the modal', async () => {
  const user = userEvent.setup();
  const toggle = jest.fn();
  render(makeModal({ isOpen: true, toggle }));

  // note that outer div covers the entire screen
  await user.click(screen.getByRole('dialog'));
  expect(toggle).toBeCalledTimes(1);

  jest.clearAllMocks();
  const modalContent = document.querySelector('.modal-content')!;
  await user.click(modalContent);
  expect(toggle).toBeCalledTimes(0);
});

it('calls onOpen when opens', () => {
  const onOpened = jest.fn();
  const toggle = jest.fn();
  const { rerender } = render(makeModal({ isOpen: false, toggle, onOpened }));
  expect(onOpened).not.toBeCalled();
  rerender(makeModal({ isOpen: true, onOpened }));
  expect(onOpened).toBeCalledTimes(1);
});
