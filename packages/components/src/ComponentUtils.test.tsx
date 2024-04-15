import React, { PropsWithChildren } from 'react';
// We only use react-redux from tests in @deephaven/components, so it is only added as a devDependency
import { connect } from 'react-redux';
import {
  canHaveRef,
  isForwardRefComponent,
  isClassComponent,
  isWrappedComponent,
} from './ComponentUtils';

function TestComponent() {
  return <div>Test</div>;
}

class TestClass extends React.PureComponent<PropsWithChildren<never>> {
  render() {
    return <div>Test</div>;
  }
}

test('isForwardRefComponent', () => {
  expect(isForwardRefComponent(TestComponent)).toBe(false);
  expect(isForwardRefComponent(React.forwardRef(TestComponent))).toBe(true);
  expect(isForwardRefComponent(TestClass)).toBe(false);
  expect(isForwardRefComponent(connect(null, null)(TestComponent))).toBe(false);
  expect(isForwardRefComponent(connect(null, null)(TestClass))).toBe(false);
});

test('isClassComponent', () => {
  expect(isClassComponent(TestComponent)).toBe(false);
  expect(isClassComponent(TestClass)).toBe(true);
  expect(isClassComponent(React.forwardRef(TestComponent))).toBe(false);
  expect(isClassComponent(connect(null, null)(TestComponent))).toBe(false);
  expect(isClassComponent(connect(null, null)(TestClass))).toBe(true);
});

test('isWrappedComponent', () => {
  expect(isWrappedComponent(TestComponent)).toBe(false);
  expect(isWrappedComponent(TestClass)).toBe(false);
  expect(isWrappedComponent(connect(null, null)(TestComponent))).toBe(true);
  expect(isWrappedComponent(React.forwardRef(TestComponent))).toBe(false);
  expect(isWrappedComponent(connect(null, null)(TestClass))).toBe(true);
});

test('canHaveRef', () => {
  const forwardedType = React.forwardRef(TestComponent);

  expect(canHaveRef(TestComponent)).toBe(false);
  expect(canHaveRef(forwardedType)).toBe(true);
  expect(canHaveRef(TestClass)).toBe(true);
  expect(
    canHaveRef(connect(null, null, null, { forwardRef: true })(TestClass))
  ).toBe(true);
});
