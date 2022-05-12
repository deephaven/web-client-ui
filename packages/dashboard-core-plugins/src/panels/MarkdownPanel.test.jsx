import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownPanel } from './MarkdownPanel';

jest.mock('@deephaven/dashboard', () => ({
  ...jest.requireActual('@deephaven/dashboard'),
  LayoutUtils: {
    getTitleFromContainer: jest.fn(() => 'TEST_PANEL_TITLE'),
  },
}));

function makeGlComponent() {
  return {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    parent: { on: jest.fn(), off: jest.fn() },
    title: 'TEST',
  };
}

function makeUser() {
  return { name: 'testUser' };
}

function mountMarkdownPanel(
  glContainer = makeGlComponent(),
  glEventHub = makeGlComponent(),
  panelState = { content: 'TEST' },
  user = makeUser,
  markdownWidgets = [],
  openedMarkdowns = [],
  closedPanels = []
) {
  return render(
    <MarkdownPanel
      glContainer={glContainer}
      glEventHub={glEventHub}
      panelState={panelState}
      user={user}
      markdownWidgets={markdownWidgets}
      openedMarkdowns={openedMarkdowns}
      closedPanels={closedPanels}
    />
  );
}

it('mount/unmount MarkdownPanel without crashing', () => {
  mountMarkdownPanel();
});
