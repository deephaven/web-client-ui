import React, { type PropsWithChildren } from 'react';
// We only use react-redux from tests in @deephaven/components, so it is only added as a devDependency
import { connect } from 'react-redux';
import {
  canHaveRef,
  isClassComponent,
  isWrappedComponent,
  isForwardRefComponentType,
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
  expect(isForwardRefComponentType(TestComponent)).toBe(false);
  expect(isForwardRefComponentType(React.forwardRef(TestComponent))).toBe(true);
  expect(isForwardRefComponentType(TestClass)).toBe(false);
  expect(isForwardRefComponentType(connect(null, null)(TestComponent))).toBe(
    false
  );
  expect(isForwardRefComponentType(connect(null, null)(TestClass))).toBe(false);
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
  expect(canHaveRef(connect(null, null)(TestClass))).toBe(true);
  expect(
    canHaveRef(connect(null, null, null, { forwardRef: true })(TestClass))
  ).toBe(true);
});
