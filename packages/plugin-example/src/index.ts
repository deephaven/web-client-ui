import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import ExampleWidgetView from './ExampleWidgetView';

/**
 * Example ES module widget plugin.
 *
 * This plugin is built as a modern ES module (`formats: ['es']`) and resolves
 * its host singletons (`react`, `@deephaven/*`, ...) through the import map the
 * host injects at runtime. Its view lazy-loads a heavier component (and that
 * component's SCSS) on demand via dynamic `import()`, demonstrating code
 * splitting of remotely loaded plugins.
 */
const ExamplePlugin: WidgetPlugin = {
  name: '@deephaven/plugin-example',
  title: 'Example',
  type: PluginType.WIDGET_PLUGIN,
  supportedTypes: 'Example',
  component: ExampleWidgetView,
  icon: vsGraph,
};

export default ExamplePlugin;
