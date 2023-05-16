import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  OpenedPanelMap,
  PanelComponent,
  PanelManager,
} from '@deephaven/dashboard';
import GoldenLayout, { Config } from '@deephaven/golden-layout';
import dh from '@deephaven/jsapi-shim';
import { TypeValue as FilterTypeValue } from '@deephaven/filters';
import ToolType from './ToolType';
import { Linker } from './Linker';
import { Link, LinkPoint, LinkType } from './LinkerUtils';

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

function makeLinkPoint(
  panelId: string | string[],
  columnName: string,
  columnType: string | null,
  panelComponent?: string | null
): LinkPoint {
  return { panelId, panelComponent, columnName, columnType };
}

function makeLink(
  start: LinkPoint,
  end: LinkPoint,
  id: string,
  type: LinkType,
  isReversed?: boolean | undefined,
  operator?: FilterTypeValue | undefined
): Link {
  return { start, end, id, isReversed, type, operator };
}

function mountLinker({
  links = [] as Link[],
  timeZone = 'TIMEZONE',
  activeTool = ToolType.LINKER,
  localDashboardId = 'TEST_ID',
  layout = makeLayout(),
  panelManager = makePanelManager(),
  setActiveTool = jest.fn(),
  setDashboardLinks = jest.fn(),
  addDashboardLinks = jest.fn(),
  deleteDashboardLinks = jest.fn(),
  setDashboardIsolatedLinkerPanelId = jest.fn(),
  setDashboardColumnSelectionValidator = jest.fn(),
} = {}) {
  return render(
    <Linker
      dh={dh}
      links={links}
      timeZone={timeZone}
      activeTool={activeTool}
      localDashboardId={localDashboardId}
      layout={layout}
      panelManager={panelManager}
      setActiveTool={setActiveTool}
      setDashboardLinks={setDashboardLinks}
      addDashboardLinks={addDashboardLinks}
      deleteDashboardLinks={deleteDashboardLinks}
      setDashboardIsolatedLinkerPanelId={setDashboardIsolatedLinkerPanelId}
      setDashboardColumnSelectionValidator={
        setDashboardColumnSelectionValidator
      }
    />
  );
}

it('closes Linker when escape key or Done button is pressed', async () => {
  const setActiveTool = jest.fn();
  mountLinker({ setActiveTool });
  const dialog = screen.getByTestId('linker-toast-dialog');
  const buttons = await screen.findAllByRole('button');
  expect(buttons).toHaveLength(3);

  const doneButton = screen.getByRole('button', { name: 'Done' });
  fireEvent.click(doneButton);
  expect(setActiveTool).toHaveBeenCalledWith(ToolType.DEFAULT);

  fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(setActiveTool).toHaveBeenCalledWith(ToolType.DEFAULT);
});

describe('tests link operations', () => {
  const deleteDashboardLinks = jest.fn();
  const setDashboardLinks = jest.fn();
  let linkPaths: HTMLElement[] = [];

  beforeEach(async () => {
    const links: Link[] = [];
    for (let i = 0; i < 4; i += 1) {
      const start = makeLinkPoint(
        'PANEL_ID_A',
        `COLUMN_A`,
        'int',
        'PANEL_COMPONENT'
      );
      const end = makeLinkPoint(
        'PANEL_ID_B',
        `COLUMN_B_${i}`,
        'long',
        'PANEL_COMPONENT'
      );
      const link = makeLink(start, end, `LINK_ID_${i}`, 'tableLink');
      links.push(link);
    }
    mountLinker({ links, deleteDashboardLinks, setDashboardLinks });
    linkPaths = screen.getAllByTestId('link-select');
    expect(linkPaths).toHaveLength(4);
  });

  it('deletes correct link with alt+click', async () => {
    expect(linkPaths).toHaveLength(4);
    fireEvent.click(linkPaths[0], { altKey: true });
    expect(deleteDashboardLinks).toHaveBeenCalledWith('TEST_ID', ['LINK_ID_0']);
  });

  it('deletes all links when Clear All is clicked', async () => {
    const clearAllButton = screen.getByRole('button', { name: 'Clear All' });
    fireEvent.click(clearAllButton);
    expect(setDashboardLinks).toHaveBeenCalledWith('TEST_ID', []);
  });
});
