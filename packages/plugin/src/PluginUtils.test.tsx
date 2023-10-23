import React from 'react';
import { dhTruck, vsPreview } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { DashboardPlugin, PluginType, type WidgetPlugin } from './PluginTypes';
import { pluginSupportsType, getIconForPlugin } from './PluginUtils';

function TestWidget() {
  return <div>TestWidget</div>;
}

const widgetPlugin: WidgetPlugin = {
  name: 'test-widget-plugin',
  type: PluginType.WIDGET_PLUGIN,
  component: TestWidget,
  supportedTypes: ['test-widget', 'test-widget-two'],
};

const dashboardPlugin: DashboardPlugin = {
  name: 'test-widget-plugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: TestWidget,
};

test('pluginSupportsType', () => {
  expect(pluginSupportsType(widgetPlugin, 'test-widget')).toBe(true);
  expect(pluginSupportsType(widgetPlugin, 'test-widget-two')).toBe(true);
  expect(pluginSupportsType(widgetPlugin, 'test-widget-three')).toBe(false);
  expect(pluginSupportsType(dashboardPlugin, 'test-widget')).toBe(false);
  expect(pluginSupportsType(undefined, 'test-widget')).toBe(false);
});

const DEFAULT_ICON = <FontAwesomeIcon icon={vsPreview} />;

describe('getIconForPlugin', () => {
  test('default icon', () => {
    expect(getIconForPlugin(widgetPlugin)).toEqual(DEFAULT_ICON);
  });

  test('default icon for non-widget plugin', () => {
    expect(getIconForPlugin(dashboardPlugin)).toEqual(DEFAULT_ICON);
  });

  test('custom icon', () => {
    const customIcon = <FontAwesomeIcon icon={dhTruck} />;
    const customWidgetPlugin: WidgetPlugin = {
      ...widgetPlugin,
      icon: dhTruck,
    };
    expect(getIconForPlugin(customWidgetPlugin)).toEqual(customIcon);
  });

  test('custom icon element', () => {
    const customIcon = <div>Test</div>;
    const customWidgetPlugin: WidgetPlugin = {
      ...widgetPlugin,
      icon: customIcon,
    };
    expect(getIconForPlugin(customWidgetPlugin)).toEqual(customIcon);
  });
});
