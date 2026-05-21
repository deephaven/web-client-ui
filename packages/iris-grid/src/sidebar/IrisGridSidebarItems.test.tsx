/**
 * Tests for the `sidebarItems` IrisGrid prop and plugin-page
 * rendering.
 *
 * Covers:
 *   - default identity (no transform) renders the built-in menu
 *   - transform that hides one item drops it from the menu list
 *   - transform that adds an item with `configPage` causes
 *     `openOptions` to render that page through the default switch arm
 *   - transform that throws falls back to defaults and logs once
 *   - dev-mode duplicate-key warning fires
 */
import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, type Settings } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import IrisGrid from '../IrisGrid';
import IrisGridTestUtils from '../IrisGridTestUtils';
import OptionType, { type SidebarItemKey } from './OptionType';
import { type OptionItem } from '../CommonTypes';

const VIEW_SIZE = 500;

const DEFAULT_SETTINGS: Settings = {
  timeZone: 'America/New_York',
  defaultDateTimeFormat: DateUtils.FULL_DATE_FORMAT,
  showTimeZone: false,
  showTSeparator: true,
  formatter: [],
  truncateNumbersWithPound: false,
};

const irisGridTestUtils = new IrisGridTestUtils(dh);

jest
  .spyOn(Element.prototype, 'getBoundingClientRect')
  .mockReturnValue(new DOMRect(0, 0, VIEW_SIZE, VIEW_SIZE));
jest.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(VIEW_SIZE);
jest.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(VIEW_SIZE);

function mountGrid(
  extraProps: Partial<React.ComponentProps<typeof IrisGrid>> = {}
) {
  const model = irisGridTestUtils.makeModel();
  let ref!: React.RefObject<IrisGrid>;
  function GridWithRef() {
    ref = useRef<IrisGrid>(null);
    return (
      <IrisGrid
        model={model}
        settings={DEFAULT_SETTINGS}
        ref={ref}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...extraProps}
      />
    );
  }
  render(<GridWithRef />);
  const grid = ref.current!;
  return { grid, model };
}

/**
 * Force the Table Options menu open so the rendered menu items are
 * mounted in the DOM. Pokes IrisGrid state directly to avoid a
 * click-driven path.
 */
function openMenu(grid: IrisGrid): void {
  act(() => {
    grid.setState({ isMenuShown: true });
  });
}

/**
 * Push a sidebar page onto the open-options stack so the
 * page-switch render path runs.
 */
function pushOpenOption(grid: IrisGrid, option: OptionItem): void {
  act(() => {
    grid.setState({ openOptions: [option] });
  });
}

describe('IrisGrid sidebarItems prop', () => {
  it('renders the built-in menu unchanged when sidebarItems is omitted', () => {
    const { grid } = mountGrid();
    openMenu(grid);
    // A representative built-in item should still be in the menu.
    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    expect(screen.getByText('Go to')).toBeInTheDocument();
  });

  it('hides built-in items filtered out by the transform', () => {
    const sidebarItems = (defaults: readonly OptionItem[]) =>
      defaults.filter(item => item.type !== OptionType.QUICK_FILTERS);
    const { grid } = mountGrid({ sidebarItems });
    openMenu(grid);
    expect(screen.queryByText('Quick Filters')).not.toBeInTheDocument();
    // Sanity: another built-in is still present.
    expect(screen.getByText('Go to')).toBeInTheDocument();
  });

  it('renders an added plugin item via its configPage', () => {
    const PLUGIN_KEY: SidebarItemKey = 'plugin:test:hello';
    const PluginPage: React.FC<{ onBack: () => void }> = ({ onBack }) => (
      <div data-testid="plugin-page">
        Hello from plugin
        <button type="button" onClick={onBack}>
          back
        </button>
      </div>
    );
    const pluginItem: OptionItem = {
      type: PLUGIN_KEY,
      title: 'Plugin Hello',
      configPage: PluginPage,
    };
    const sidebarItems = (defaults: readonly OptionItem[]) => [
      ...defaults,
      pluginItem,
    ];
    const { grid } = mountGrid({ sidebarItems });
    openMenu(grid);
    // The added item appears in the menu list.
    expect(screen.getByText('Plugin Hello')).toBeInTheDocument();
    // Pushing the plugin item onto the page stack renders its
    // configPage through the page-switch `default` arm.
    pushOpenOption(grid, pluginItem);
    expect(screen.getByTestId('plugin-page')).toBeInTheDocument();
  });

  it('falls back to defaults and logs once when the transform throws', () => {
    const log = Log.module('IrisGrid');
    const errorSpy = jest.spyOn(log, 'error').mockImplementation(() => {
      /* swallow */
    });
    const sidebarItems = (): readonly OptionItem[] => {
      throw new Error('boom');
    };
    const { grid } = mountGrid({ sidebarItems });
    openMenu(grid);
    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('warns in development when the transform produces duplicate types', () => {
    const log = Log.module('IrisGrid');
    const warnSpy = jest.spyOn(log, 'warn').mockImplementation(() => {
      /* swallow */
    });
    const dupKey: SidebarItemKey = 'plugin:test:dup';
    const sidebarItems = (defaults: readonly OptionItem[]) => [
      ...defaults,
      { type: dupKey, title: 'A' } as OptionItem,
      { type: dupKey, title: 'B' } as OptionItem,
    ];
    const { grid } = mountGrid({ sidebarItems });
    openMenu(grid);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`duplicate type "${dupKey}"`)
    );
    warnSpy.mockRestore();
  });
});
