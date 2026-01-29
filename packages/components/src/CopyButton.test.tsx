import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyButton, { type CopyButtonProps } from './CopyButton';

const mockCopyToClipboard = jest.fn();
let mockCopied = false;

jest.mock('@deephaven/react-hooks', () => ({
  ...jest.requireActual('@deephaven/react-hooks'),
  useCopyToClipboard: () => [mockCopied, mockCopyToClipboard],
}));

function makeCopyButton({
  copy = 'test value',
  ...rest
}: Partial<CopyButtonProps> = {}) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return render(<CopyButton copy={copy} {...rest} />);
}

beforeEach(() => {
  mockCopied = false;
  mockCopyToClipboard.mockClear();
});

it('mounts and unmounts without failing', () => {
  makeCopyButton();
});

it('renders with default tooltip', () => {
  makeCopyButton();
  expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
});

it('renders with custom tooltip', () => {
  makeCopyButton({ tooltip: 'Copy column name' });
  expect(
    screen.getByRole('button', { name: 'Copy column name' })
  ).toBeInTheDocument();
});

it('copies string value when clicked', async () => {
  const user = userEvent.setup();
  makeCopyButton({ copy: 'my text to copy' });

  await user.click(screen.getByRole('button'));

  expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
  expect(mockCopyToClipboard).toHaveBeenCalledWith('my text to copy');
});

it('copies result of function when clicked', async () => {
  const user = userEvent.setup();
  const copyFn = jest.fn(() => 'dynamic value');
  makeCopyButton({ copy: copyFn });

  await user.click(screen.getByRole('button'));

  expect(copyFn).toHaveBeenCalledTimes(1);
  expect(mockCopyToClipboard).toHaveBeenCalledWith('dynamic value');
});

it('shows "Copied" tooltip when copied is true', () => {
  mockCopied = true;
  makeCopyButton();

  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
});

it('renders children as text', () => {
  makeCopyButton({ children: 'Copy Text' });

  expect(screen.getByText('Copy Text')).toBeInTheDocument();
});

it('hides tooltip when children are provided and tooltip is default', () => {
  const { container } = makeCopyButton({ children: 'Copy Label' });

  // Tooltip should not be rendered when children exist and tooltip is default
  expect(container.querySelector('[class*="Tooltip"]')).toBeNull();
});

it('shows "Copied" tooltip when children are provided and copied is true', () => {
  mockCopied = true;
  makeCopyButton({ children: 'Copy Label' });

  // "Copied" tooltip should show even with children because it differs from default
  expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
});

it('shows tooltip when children are provided but tooltip is custom', () => {
  makeCopyButton({ children: 'Copy Label', tooltip: 'Custom tooltip' });

  // Custom tooltip should still show even with children
  expect(
    screen.getByRole('button', { name: 'Custom tooltip' })
  ).toBeInTheDocument();
});

it('passes additional props to ActionButton', () => {
  makeCopyButton({ isDisabled: true });

  expect(screen.getByRole('button')).toBeDisabled();
});
