import { type PanelComponent } from '@deephaven/dashboard';
import { type TypeValue as FilterTypeValue } from '@deephaven/filters';
import LinkerUtils, {
  type Link,
  type LinkType,
  type LinkPoint,
  type LinkColumn,
  isLinkableColumn,
  isLinkableFromPanel,
  isLinkablePanel,
} from './LinkerUtils';

function makeLinkPoint(
  panelId: string,
  columnName: string,
  columnType: string | null
): LinkPoint {
  return { panelId, columnName, columnType };
}

function makeLinkColumn(
  name: string,
  type: string | null,
  description?: string | undefined
): LinkColumn {
  return { name, type, description };
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

function makeGridPanel() {
  return {
    props: { inputFilters: [] },
    state: { panelState: null },
  };
}

test('Panels are not linkable if they do not have the required functions', () => {
  const gridPanel = makeGridPanel();
  const panel = gridPanel as unknown as PanelComponent;
  // isLinkableFromPanel requires the getCoordinateForColumn method
  expect(isLinkableFromPanel(panel)).toBe(false);
  // isLinkablePanel requires getCoordinateForColumn, setFilterMap, and unsetFilterValue methods
  expect(isLinkablePanel(panel)).toBe(false);
});

test("isLinkableColumn returns false if column description starts with 'Preview of type:'", () => {
  let column = makeLinkColumn(`COLUMN_A`, 'int');
  expect(isLinkableColumn(column)).toBe(true);
  column = makeLinkColumn(`COLUMN_A`, 'int', 'This is a column description');
  expect(isLinkableColumn(column)).toBe(true);
  column = makeLinkColumn(`COLUMN_A`, 'int', 'Preview of type: vector.long');
  expect(isLinkableColumn(column)).toBe(false);
});

describe('isLinkValid', () => {
  it('returns false if start and end panel IDs are the same', () => {
    const start = makeLinkPoint('PANEL_ID', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID', 'COLUMN_B', 'int');
    expect(LinkerUtils.isLinkValid(start, end)).toBe(false);
  });

  it('returns false if neither start or end panel IDs and isolated panel ID match', () => {
    const start = makeLinkPoint('PANEL_ID_A', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID_B', 'COLUMN_B', 'int');
    const isolatedLinkerPanelId = 'PANEL_ID_C';
    expect(LinkerUtils.isLinkValid(start, end, isolatedLinkerPanelId)).toBe(
      false
    );
  });

  it('returns false if column types are not compatible', () => {
    const start = makeLinkPoint('PANEL_ID_A', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID_B', 'COLUMN_B', 'java.lang.String');
    expect(LinkerUtils.isLinkValid(start, end)).toBe(false);
  });

  it('returns true if start and end panel IDs are different and column types are the same', () => {
    const start = makeLinkPoint('PANEL_ID_A', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID_B', 'COLUMN_B', 'int');
    expect(LinkerUtils.isLinkValid(start, end)).toBe(true);
  });

  it('returns true if start and end panel IDs are different and column types are compatible', () => {
    const start = makeLinkPoint('PANEL_ID_A', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID_B', 'COLUMN_B', 'long');
    expect(LinkerUtils.isLinkValid(start, end)).toBe(true);
  });
});

it('finds columns correctly', () => {
  const columns: LinkColumn[] = [];
  for (let i = 0; i < 4; i += 1) {
    const column = makeLinkColumn(`COLUMN_${i}`, 'int');
    columns.push(column);
  }

  let linkPoint = makeLinkPoint('PANEL_ID', 'COLUMN_2', 'int');
  expect(LinkerUtils.findColumn(columns, linkPoint)).toBe(columns[2]);
  linkPoint = makeLinkPoint('PANEL_ID', 'COLUMN_2', 'BAD_TYPE');
  expect(LinkerUtils.findColumn(columns, linkPoint)).toBe(undefined);
  linkPoint = makeLinkPoint('PANEL_ID', 'COLUMN_3', 'boolean');
  expect(LinkerUtils.findColumn(columns, linkPoint)).toBe(undefined);
});

it('clones links properly', () => {
  const cloneId = 'CLONE_ID';
  const links: Link[] = [];
  for (let i = 0; i < 3; i += 1) {
    const start = makeLinkPoint('PANEL_ID_A', 'COLUMN_A', 'int');
    const end = makeLinkPoint('PANEL_ID_B', 'COLUMN_B', 'long');
    const link = makeLink(start, end, 'LINK_ID', 'tableLink');
    links.push(link);
  }

  let panelId = 'PANEL_ID_A';
  let clonedLinks = LinkerUtils.cloneLinksForPanel(links, panelId, cloneId);
  expect(clonedLinks).toHaveLength(3);
  for (let i = 0; i < 3; i += 1) {
    expect(clonedLinks[i].id === links[i].id).toBe(false);
    expect(clonedLinks[i].start.panelId).toBe(cloneId);
  }

  panelId = 'PANEL_ID_B';
  clonedLinks = LinkerUtils.cloneLinksForPanel(links, panelId, cloneId);
  expect(clonedLinks).toHaveLength(3);
  for (let i = 0; i < 3; i += 1) {
    expect(clonedLinks[i].id === links[i].id).toBe(false);
    expect(clonedLinks[i].end?.panelId).toBe(cloneId);
  }

  panelId = 'PANEL_ID_C';
  clonedLinks = LinkerUtils.cloneLinksForPanel(links, panelId, cloneId);
  expect(clonedLinks).toHaveLength(0);
});
