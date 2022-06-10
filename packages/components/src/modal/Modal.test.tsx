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
  return render(
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

it('renders', () => {
  makeModal({});
});

it('does not render when isOpen is false', () => {
  makeModal({ isOpen: false });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('calls toggle when esc key is pressed', () => {
  const toggle = jest.fn();
  const { container } = makeModal({ isOpen: true, keyboard: true, toggle });
  fireEvent.keyDown(container, { key: 'Escape' });
  expect(toggle).toBeCalledTimes(1);
});

it('does not calls toggle when esc key is pressed when keyboard is false', () => {
  const toggle = jest.fn();
  const { container } = makeModal({ isOpen: true, keyboard: false, toggle });
  fireEvent.keyDown(container, { key: 'Escape' });
  expect(toggle).toBeCalledTimes(0);
});

it('closes only when clicking outside the modal', () => {
  const toggle = jest.fn();
  makeModal({ isOpen: true, toggle });

  // note that outer div covers the entire screen
  const outerDiv = screen.getAllByRole('dialog')[0];
  userEvent.click(outerDiv);
  expect(toggle).toBeCalledTimes(1);

  jest.clearAllMocks();
  userEvent.click(screen.getAllByRole('dialog')[1]);
  expect(toggle).toBeCalledTimes(0);
});

it('calls onOpen when opens', () => {
  const onOpened = jest.fn();
  const toggle = jest.fn();
  const { rerender } = makeModal({ isOpen: false, toggle, onOpened });
  expect(onOpened).not.toBeCalled();
  rerender(<Modal isOpen onOpened={onOpened} />);
  expect(onOpened).toBeCalledTimes(1);
});
