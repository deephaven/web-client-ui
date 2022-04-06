/* eslint-disable no-unused-vars */
/* eslint-disable react/prefer-stateless-function */
/* eslint func-names: "off" */
import React, { Component } from 'react';
import GoldenLayout from '@deephaven/golden-layout';
import { render } from '@testing-library/react';
import Panel from './Panel';

class TestComponentPanel extends Component {}

function makeChildren() {
  return <div>Test Children</div>;
}

function makeComponentPanel() {
  return new TestComponentPanel();
}

function makeGlComponent({
  on = jest.fn(),
  off = jest.fn(),
  emit = jest.fn(),
} = {}) {
  return { on, off, emit: jest.fn() };
}

function renderPanel({
  children = makeChildren(),
  componentPanel = makeComponentPanel(),
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  onResize = jest.fn(),
  onShow = jest.fn(),
  onBeforeShow = jest.fn(),
  onHide = jest.fn(),
  onTab = jest.fn(),
  onTabClicked = jest.fn(),
} = {}) {
  return render(
    <Panel
      componentPanel={componentPanel}
      glContainer={glContainer}
      glEventHub={glEventHub}
      onResize={onResize}
      onShow={onShow}
      onBeforeShow={onBeforeShow}
      onHide={onHide}
      onTab={onTab}
      onTabClicked={onTabClicked}
    >
      {children}
    </Panel>
  );
}

it('renders without crashing', () => {
  renderPanel();
});

describe('adds and emits events correctly', () => {
  it('emits a signal when the tab is clicked', () => {
    const on = jest.fn();
    const off = jest.fn();
    const onResize = jest.fn();
    const onShow = jest.fn();
    const onBeforeShow = jest.fn();
    const onHide = jest.fn();
    const onTab = jest.fn();
    const onTabClicked = jest.fn();

    const glContainer = makeGlComponent({ on, off });
    const { unmount } = renderPanel({
      glContainer,
      onResize,
      onShow,
      onBeforeShow,
      onHide,
      onTab,
      onTabClicked,
    });

    // Map of event names to callbacks
    const propCallbacks = new Map();
    propCallbacks.set('resize', onResize);
    propCallbacks.set('show', onBeforeShow);
    propCallbacks.set('shown', onShow);
    propCallbacks.set('hide', onHide);
    propCallbacks.set('tab', onTab);
    propCallbacks.set('tabClicked', onTabClicked);

    const eventCallbacks = new Map();
    for (let i = 0; i < on.mock.calls.length; i += 1) {
      const call = on.mock.calls[i];
      eventCallbacks.set(call[0], call[1]);
    }

    // If we start listening to something else in Panel, we want to add it to the tests as well, so check the size
    expect(on).toHaveBeenCalledTimes(propCallbacks.size);
    expect(off).not.toHaveBeenCalled();

    const eventNames = [...propCallbacks.keys()];
    for (let i = 0; i < eventNames.length; i += 1) {
      const eventName = eventNames[i];
      const testArg = { eventName };
      const propCallback = propCallbacks.get(eventName);
      expect(propCallback).not.toHaveBeenCalled();
      eventCallbacks.get(eventName)(testArg);
      expect(propCallback).toHaveBeenCalledWith(testArg);
    }

    unmount();

    // Make sure we call `off` with the correct event names on unmount
    for (let i = 0; i < eventNames.length; i += 1) {
      const eventName = eventNames[i];
      expect(off).toHaveBeenCalledWith(
        eventName,
        eventCallbacks.get(eventName)
      );
    }
  });
});
