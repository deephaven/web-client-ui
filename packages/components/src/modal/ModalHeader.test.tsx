import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalHeader from './ModalHeader';

function makeModalHeader({
  className,
  children,
  closeButton,
  style,
  toggle,
  'data-testid': dataTestId,
}: {
  className?: string;
  children?;
  closeButton?;
  style?;
  toggle?;
  'data-testid'?: string;
}) {
  return render(
    <ModalHeader
      className={className}
      closeButton={closeButton}
      style={style}
      toggle={toggle}
    >
      {children}
    </ModalHeader>
  );
}

it('renders', () => {
  makeModalHeader({});
});

it('renders a functional close button', () => {
  const toggle = jest.fn();
  makeModalHeader({ closeButton: true, toggle });
  const closeButton = screen.getByRole('button');
  expect(closeButton).toBeInTheDocument();
  userEvent.click(closeButton);
  expect(toggle).toBeCalledTimes(1);
});

it('does not render close button', () => {
  makeModalHeader({ closeButton: false });
  const closeButton = screen.queryByRole('button');
  expect(closeButton).toBeNull();
});

it('renders children correctly', () => {
  makeModalHeader({ closeButton: false, children: <p>Test Children</p> });
  expect(screen.getByText('Test Children')).toBeInTheDocument();
});
