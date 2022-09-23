/* eslint-disable react/prop-types */
/* eslint react/prefer-stateless-function: "off" */
/* eslint react/no-multi-comp: "off" */
/* eslint max-classes-per-file: "off" */

import { Component } from 'react';
import GoldenLayout from '@deephaven/golden-layout';
import type { ContentItem, Tab } from '@deephaven/golden-layout';
import PanelManager from './PanelManager';
import PanelEvent from './PanelEvent';
import { PanelProps } from './DashboardPlugin';

type TestComponentProps = { id: string } & PanelProps;

class TestComponentA extends Component<TestComponentProps> {}

class TestComponentB extends Component<TestComponentProps> {}

function makeContainer(id: string): GoldenLayout.Container {
  return {
    tab: {
      contentItem: {
        config: { id, component: 'TestComponentA', type: 'TestComponentA' },
      } as ContentItem,
    } as Tab,
  } as GoldenLayout.Container;
}

function makeEventHub(): GoldenLayout.EventEmitter {
  return {} as GoldenLayout.EventEmitter;
}

function makeLayout() {
  return new GoldenLayout({});
}

function makeProps(id: string): TestComponentProps {
  return {
    id,
    glContainer: makeContainer(id),
    glEventHub: makeEventHub(),
  };
}

function makeComponentA(id = 'A'): TestComponentA {
  return new TestComponentA(makeProps(id));
}

function makeComponentB(id = 'B'): TestComponentB {
  return new TestComponentB(makeProps(id));
}

it('creates without crashing', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);
  expect(panelManager).not.toBe(null);
});

it('handles panels mounting and unmounting', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);

  const panel = makeComponentA();
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

  const panelA = makeComponentA();
  const panelB = makeComponentB();
  layout.eventHub.emit(PanelEvent.MOUNT, panelA);
  layout.eventHub.emit(PanelEvent.MOUNT, panelB);

  expect(panelManager.getLastUsedPanelOfType(TestComponentA)).toBe(panelA);
  expect(panelManager.getLastUsedPanelOfType(TestComponentB)).toBe(panelB);

  layout.eventHub.emit(PanelEvent.UNMOUNT, panelA);
  layout.eventHub.emit(PanelEvent.UNMOUNT, panelB);
});

it('get last used panel for multiple types', () => {
  const layout = makeLayout();
  const panelManager = new PanelManager(layout);

  const panelA = makeComponentA();
  const panelB = makeComponentB();
  layout.eventHub.emit(PanelEvent.MOUNT, panelA);
  layout.eventHub.emit(PanelEvent.MOUNT, panelB);

  expect(panelManager.getLastUsedPanelOfTypes([TestComponentA])).toBe(panelA);
  expect(
    panelManager.getLastUsedPanelOfTypes([TestComponentA, TestComponentB])
  ).toBe(panelB);
  expect(
    panelManager.getLastUsedPanelOfTypes([TestComponentB, TestComponentA])
  ).toBe(panelB);

  layout.eventHub.emit(PanelEvent.UNMOUNT, panelA);
  layout.eventHub.emit(PanelEvent.UNMOUNT, panelB);
});
