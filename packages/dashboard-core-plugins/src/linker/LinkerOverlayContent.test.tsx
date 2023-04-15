import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OpenedPanelMap,
  PanelComponent,
  PanelManager,
} from '@deephaven/dashboard';
import GoldenLayout, { Config } from '@deephaven/golden-layout';
import LinkerOverlayContent from './LinkerOverlayContent';

const LINKER_OVERLAY_MESSAGE = 'TEST_MESSAGE';

function makeLayout() {
  return new GoldenLayout({} as Config, undefined);
}

function makePanelManager(layout = makeLayout()) {
  const PANEL_ID_A = 'PANEL_ID_A';
  const PANEL_ID_B = 'PANEL_ID_B';
  const openedMap: OpenedPanelMap = new Map([
    [
      PANEL_ID_A,
      {
        getCoordinateForColumn: jest.fn(() => {
          const coordinate = [5, 5];
          return coordinate; // make coordinates here
        }),
      } as PanelComponent,
    ],
    [
      PANEL_ID_B,
      {
        getCoordinateForColumn: jest.fn(() => {
          const coordinate = [50, 50];
          return coordinate; // make coordinates here
        }),
      } as PanelComponent,
    ],
  ]);
  return new PanelManager(layout, undefined, undefined, openedMap);
}

function mountOverlay({
  links = [] as Link[],
  selectedIds = new Set<string>(),
  messageText = LINKER_OVERLAY_MESSAGE,
  onLinkDeleted = jest.fn(),
  onAllLinksDeleted = jest.fn(),
  onCancel = jest.fn(),
  onDone = jest.fn(),
  onLinksUpdated = jest.fn(),
  onLinkSelected = jest.fn(),
  panelManager = makePanelManager(),
} = {}) {
  return render(
    <LinkerOverlayContent
      links={links}
      selectedIds={selectedIds}
      messageText={messageText}
      onLinkDeleted={onLinkDeleted}
      onAllLinksDeleted={onAllLinksDeleted}
      onCancel={onCancel}
      onDone={onDone}
      onLinksUpdated={onLinksUpdated}
      onLinkSelected={onLinkSelected}
      panelManager={panelManager}
    />
  );
}

it('calls appropriate functions on button and key presses', async () => {
  const onLinkDeleted = jest.fn();
  const onAllLinksDeleted = jest.fn();
  const onCancel = jest.fn();
  const onDone = jest.fn();
  const selectedIds = new Set<string>(['TEST_ID']);
  mountOverlay({
    onLinkDeleted,
    onAllLinksDeleted,
    onCancel,
    onDone,
    selectedIds,
  });

  const dialog = screen.getByTestId('linker-toast-dialog');
  expect(dialog).toHaveTextContent(LINKER_OVERLAY_MESSAGE);
  const buttons = await screen.findAllByRole('button');
  expect(buttons).toHaveLength(3);

  const clearAllButton = screen.getByRole('button', { name: 'Clear All' });
  fireEvent.click(clearAllButton);
  expect(onAllLinksDeleted).toHaveBeenCalled();

  const doneButton = screen.getByRole('button', { name: 'Done' });
  fireEvent.click(doneButton);
  expect(onDone).toHaveBeenCalled();

  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Delete' });
  fireEvent.keyDown(document, { key: 'Backspace' });
  expect(onLinkDeleted).toHaveBeenCalledTimes(2);
});
