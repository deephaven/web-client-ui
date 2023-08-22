import {
  PluginType,
  isAuthPlugin,
  isDashboardPlugin,
  isTablePlugin,
} from './PluginTypes';

test('isDashboardPlugin', () => {
  expect(
    isDashboardPlugin({ name: 'test', type: PluginType.DASHBOARD_PLUGIN })
  ).toBe(true);
  expect(
    isDashboardPlugin({ name: 'test', type: PluginType.TABLE_PLUGIN })
  ).toBe(false);
});

test('isAuthPlugin', () => {
  expect(isAuthPlugin({ name: 'test', type: PluginType.AUTH_PLUGIN })).toBe(
    true
  );
  expect(isAuthPlugin({ name: 'test', type: PluginType.TABLE_PLUGIN })).toBe(
    false
  );
});

test('isTablePlugin', () => {
  expect(isTablePlugin({ name: 'test', type: PluginType.TABLE_PLUGIN })).toBe(
    true
  );
  expect(isTablePlugin({ name: 'test', type: PluginType.AUTH_PLUGIN })).toBe(
    false
  );
});
