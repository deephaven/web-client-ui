/**
 * Tests for the `transformTableOptions` IrisGrid prop and plugin-page
 * rendering.
 *
 * Covers:
 *   - default identity (no transform) renders the built-in menu
 *   - transform that hides one item drops it from the menu list
 *   - transform that adds an item with `configPage` causes
 *     selecting that menu item to render its page through the
 *     default switch arm
 *   - transform that throws falls back to defaults and logs once
 *   - a later duplicate `type` overrides an earlier one (last writer wins)
 *   - a thrown `configPage` is caught by `PluginTableOptionsErrorBoundary`
 *     and a minimal fallback UI is shown
 *
 * The tests drive the UI through user-facing interactions (clicking
 * the Table Options button and selecting menu items) rather than
 * poking IrisGrid's internal state, so they survive refactors of the
 * menu/page wiring.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import dh from '@deephaven/jsapi-shim';
import { DateUtils, type Settings } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import IrisGrid from '../IrisGrid';
import IrisGridTestUtils from '../IrisGridTestUtils';
import OptionType, { type OptionItemKey } from './OptionType';
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
  render(
    <IrisGrid
      model={model}
      settings={DEFAULT_SETTINGS}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...extraProps}
    />
  );
  return { model };
}

/** Open the Table Options sidebar via the settings button. */
function openMenu(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Table Options' }));
}

/** Select a menu item by its visible title. */
function selectOption(title: string): void {
  fireEvent.click(screen.getByRole('menuitem', { name: title }));
}

describe('IrisGrid transformTableOptions prop', () => {
  it('renders the built-in menu unchanged when transformTableOptions is omitted', () => {
    mountGrid();
    openMenu();
    // Representative built-in items should still be in the menu.
    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    expect(screen.getByText('Go to')).toBeInTheDocument();
  });

  it('hides built-in items filtered out by the transform', () => {
    const transformTableOptions = (defaults: readonly OptionItem[]) =>
      defaults.filter(item => item.type !== OptionType.QUICK_FILTERS);
    mountGrid({ transformTableOptions });
    openMenu();
    expect(screen.queryByText('Quick Filters')).not.toBeInTheDocument();
    // Sanity: another built-in is still present.
    expect(screen.getByText('Go to')).toBeInTheDocument();
  });

  it('renders an added plugin item via its configPage', () => {
    const PLUGIN_KEY: OptionItemKey = 'plugin:test:hello';
    function PluginPage({ onBack }: { onBack: () => void }) {
      return (
        <div data-testid="plugin-page">
          Test plugin
          <button type="button" onClick={onBack}>
            back
          </button>
        </div>
      );
    }
    const pluginItem: OptionItem = {
      type: PLUGIN_KEY,
      title: 'Plugin Hello',
      configPage: PluginPage,
    };
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      pluginItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    // The added item appears in the menu list.
    expect(screen.getByText('Plugin Hello')).toBeInTheDocument();
    // Selecting the plugin item renders its configPage through the
    // page-switch `default` arm.
    selectOption('Plugin Hello');
    expect(screen.getByTestId('plugin-page')).toBeInTheDocument();
  });

  it('falls back to defaults and logs once when the transform throws', () => {
    const log = Log.module('IrisGrid');
    const errorSpy = jest.spyOn(log, 'error').mockImplementation(() => {
      /* swallow */
    });
    const transformTableOptions = (): readonly OptionItem[] => {
      throw new Error('boom');
    };
    mountGrid({ transformTableOptions });
    openMenu();
    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('orders plugin items by their `order` weight relative to built-ins', () => {
    const aboveItem: OptionItem = {
      type: 'plugin:test:above',
      title: 'Above Built-ins',
      order: -1,
    };
    const belowItem: OptionItem = {
      type: 'plugin:test:below',
      title: 'Below Built-ins',
      order: 1300,
    };
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      belowItem,
      aboveItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    const titles = screen
      .getAllByRole('menuitem')
      .map(item => item.textContent ?? '');
    const aboveIndex = titles.findIndex(t => t.includes('Above Built-ins'));
    const belowIndex = titles.findIndex(t => t.includes('Below Built-ins'));
    const quickFiltersIndex = titles.findIndex(t =>
      t.includes('Quick Filters')
    );
    expect(aboveIndex).toBeGreaterThanOrEqual(0);
    expect(belowIndex).toBeGreaterThanOrEqual(0);
    expect(quickFiltersIndex).toBeGreaterThanOrEqual(0);
    // Negative order floats above the built-ins, positive order sinks below.
    expect(aboveIndex).toBeLessThan(quickFiltersIndex);
    expect(belowIndex).toBeGreaterThan(quickFiltersIndex);
  });

  it('sorts items without an `order` to the end of the menu', () => {
    const noOrderItem: OptionItem = {
      type: 'plugin:test:noorder',
      title: 'No Order Plugin',
    };
    const orderedItem: OptionItem = {
      type: 'plugin:test:ordered',
      title: 'Ordered Plugin',
      order: 99999,
    };
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      noOrderItem,
      ...defaults,
      orderedItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    const titles = screen
      .getAllByRole('menuitem')
      .map(item => item.textContent ?? '');
    const noOrderIndex = titles.findIndex(t => t.includes('No Order Plugin'));
    const orderedIndex = titles.findIndex(t => t.includes('Ordered Plugin'));
    const goToIndex = titles.findIndex(t => t.includes('Go to'));
    expect(noOrderIndex).toBeGreaterThanOrEqual(0);
    expect(orderedIndex).toBeGreaterThanOrEqual(0);
    expect(goToIndex).toBeGreaterThanOrEqual(0);
    // The unordered item sinks to the very end, even past a high-`order` item
    // and the last built-in.
    expect(noOrderIndex).toBeGreaterThan(orderedIndex);
    expect(noOrderIndex).toBeGreaterThan(goToIndex);
    expect(noOrderIndex).toBe(titles.length - 1);
  });

  it('keeps the relative order of items that share the same `order`', () => {
    const firstItem: OptionItem = {
      type: 'plugin:test:first',
      title: 'First Plugin',
      order: 5,
    };
    const secondItem: OptionItem = {
      type: 'plugin:test:second',
      title: 'Second Plugin',
      order: 5,
    };
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      firstItem,
      secondItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    const titles = screen
      .getAllByRole('menuitem')
      .map(item => item.textContent ?? '');
    const firstIndex = titles.findIndex(t => t.includes('First Plugin'));
    const secondIndex = titles.findIndex(t => t.includes('Second Plugin'));
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });

  it('lets a later duplicate `type` override an earlier one (last writer wins)', () => {
    const dupKey: OptionItemKey = 'plugin:test:dup';
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      { type: dupKey, title: 'A' } as OptionItem,
      { type: dupKey, title: 'B' } as OptionItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    // The later entry wins: only 'B' is rendered, 'A' is dropped, and the
    // single surviving entry avoids a React key collision on `<Menu>`.
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('renders a fallback UI when a plugin configPage throws', () => {
    const log = Log.module('PluginTableOptionsErrorBoundary');
    const errorSpy = jest.spyOn(log, 'error').mockImplementation(() => {
      /* swallow */
    });
    // React logs uncaught render errors to console.error before the
    // boundary catches them; mute that noise so test output stays clean.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      /* swallow */
    });
    const PLUGIN_KEY: OptionItemKey = 'plugin:test:boom';
    const ThrowingPage: React.FC = () => {
      throw new Error('boom');
    };
    const pluginItem: OptionItem = {
      type: PLUGIN_KEY,
      title: 'Boom',
      configPage: ThrowingPage,
    };
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      pluginItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    selectOption('Boom');
    const fallback = screen.getByTestId('plugin-sidebar-error');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent(PLUGIN_KEY);
    expect(fallback).toHaveTextContent('boom');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
