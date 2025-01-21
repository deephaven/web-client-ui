import React from 'react';
import { render } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import ErrorBoundary, { type ErrorBoundaryProps } from './ErrorBoundary';

function ThrowComponent(): JSX.Element {
  throw new Error('Test error');
}

function makeWrapper({
  children = 'Hello World',
  className,
  onError = jest.fn(),
  fallback,
}: Partial<ErrorBoundaryProps> = {}) {
  return render(
    <ErrorBoundary className={className} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  );
}

it('should render the children if there is no error', () => {
  const onError = jest.fn();
  const { getByText } = makeWrapper({ onError });
  expect(getByText('Hello World')).toBeInTheDocument();
  expect(onError).not.toHaveBeenCalled();
});

it('should render the fallback if there is an error', () => {
  TestUtils.disableConsoleOutput();

  const onError = jest.fn();
  const error = new Error('Test error');
  const { getByText } = makeWrapper({
    children: <ThrowComponent />,
    fallback: <div>Fallback</div>,
    onError,
  });
  expect(getByText('Fallback')).toBeInTheDocument();
  expect(onError).toHaveBeenCalledWith(error, expect.anything());
});

it('should not throw if children are undefined', () => {
  expect(() =>
    render(<ErrorBoundary>{undefined}</ErrorBoundary>)
  ).not.toThrow();
});
