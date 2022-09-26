import React from 'react';
import { render } from '@testing-library/react';
import type { Container } from '@deephaven/golden-layout';
import { MarkdownPanel } from './MarkdownPanel';

jest.mock('@deephaven/dashboard', () => ({
  ...(jest.requireActual('@deephaven/dashboard') as Record<string, unknown>),
  LayoutUtils: {
    getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
  },
}));

function makeGlComponent() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    unbind: jest.fn(),
    trigger: jest.fn(),
    parent: { on: jest.fn(), off: jest.fn() },
    title: 'TEST',
  };
}

function mountMarkdownPanel(
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  panelState = { content: 'TEST' },
  closedPanels = []
) {
  return render(
    <MarkdownPanel
      glContainer={(glContainer as unknown) as Container}
      glEventHub={glEventHub}
      panelState={panelState}
      closedPanels={closedPanels}
    />
  );
}

it('mount/unmount MarkdownPanel without crashing', () => {
  mountMarkdownPanel();
});
