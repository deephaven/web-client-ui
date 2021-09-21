/* eslint react/prefer-stateless-function: "off" */
/* eslint react/no-multi-comp: "off" */
/* eslint max-classes-per-file: "off" */

import { Component } from 'react';
import GoldenLayout from '@deephaven/golden-layout';
import './layout/jquery';
import PanelManager from './PanelManager';
import PanelEvent from './PanelEvent';

class TestComponentA extends Component {
  constructor(id = 'A') {
    super({ glContainer: { tab: { contentItem: { config: { id } } } } });
  }

  render() {
    return null;
  }
}

class TestComponentB extends Component {
  constructor(id = 'B') {
    super({ glContainer: { tab: { contentItem: { config: { id } } } } });
  }

  render() {
    return null;
  }
}

function makeLayout() {
  return new GoldenLayout({});
}

it('creates without crashing', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);
  expect(panelManager).not.toBe(null);
});

it('handles panels mounting and unmounting', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);

  const panel = new TestComponentA();
  layout.eventHub.emit(PanelEvent.MOUNT, panel);

  let opened = panelManager.getOpenedPanels();

  expect(opened.length).toBe(1);
  expect(opened[0]).toBe(panel);

  layout.eventHub.emit(PanelEvent.UNMOUNT, panel);
  opened = panelManager.getOpenedPanels();
  expect(opened.length).toBe(0);
});

it('gets last used panel of type properly', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);

  const panelA = new TestComponentA();
  const panelB = new TestComponentB();
  layout.eventHub.emit(PanelEvent.MOUNT, panelA);
  layout.eventHub.emit(PanelEvent.MOUNT, panelB);

  expect(panelManager.getLastUsedPanelOfType(TestComponentA)).toBe(panelA);
  expect(panelManager.getLastUsedPanelOfType(TestComponentB)).toBe(panelB);

  layout.eventHub.emit(PanelEvent.UNMOUNT, panelA);
  layout.eventHub.emit(PanelEvent.UNMOUNT, panelB);
});
