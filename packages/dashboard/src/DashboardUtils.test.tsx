import React from 'react';
import { connect } from 'react-redux';
import { canHaveRef } from './DashboardUtils';
import { type PanelProps } from './DashboardPlugin';

test('canHaveRef', () => {
  function TestComponent() {
    return <div>Test</div>;
  }

  class TestClass extends React.PureComponent<PanelProps> {
    render() {
      return <div>Test</div>;
    }
  }

  expect(canHaveRef(TestComponent)).toBe(false);
  expect(canHaveRef(React.forwardRef(TestComponent))).toBe(true);
  expect(canHaveRef(TestClass)).toBe(true);
  expect(
    canHaveRef(connect(null, null, null, { forwardRef: true })(TestClass))
  ).toBe(true);
});
