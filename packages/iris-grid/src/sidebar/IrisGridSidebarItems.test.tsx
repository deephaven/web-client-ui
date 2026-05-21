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
 *   - dev-mode duplicate-key warning fires
 *   - a thrown `configPage` is caught by `PluginTableOptionsErrorBoundary`
 *     and a minimal fallback UI is shown
 *
 * The tests drive the UI through user-facing interactions (clicking
 * the Table Options button and selecting menu items) rather than
 * poking IrisGrid's internal state, so they survive refactors of the
 * menu/page wiring.
 */
import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

  it('warns in development when the transform produces duplicate types', () => {
    const log = Log.module('IrisGrid');
    const warnSpy = jest.spyOn(log, 'warn').mockImplementation(() => {
      /* swallow */
    });
    const dupKey: OptionItemKey = 'plugin:test:dup';
    const transformTableOptions = (defaults: readonly OptionItem[]) => [
      ...defaults,
      { type: dupKey, title: 'A' } as OptionItem,
      { type: dupKey, title: 'B' } as OptionItem,
    ];
    mountGrid({ transformTableOptions });
    openMenu();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`duplicate type "${dupKey}"`)
    );
    warnSpy.mockRestore();
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
    expect(
      within(fallback).getByRole('button', { name: 'Back' })
    ).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
