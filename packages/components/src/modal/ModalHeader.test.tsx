import React from 'react';
import { render, screen } from '@testing-library/react';
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
