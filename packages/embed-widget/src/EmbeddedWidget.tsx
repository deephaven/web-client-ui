import React, { useMemo } from 'react';
import { VariableDefinition, Widget } from '@deephaven/jsapi-types';
import { isWidgetPlugin, usePlugins } from '@deephaven/plugin';
import Log from '@deephaven/log';

export type EmbeddedWidgetType = {
  definition: VariableDefinition;
  fetch: () => Promise<unknown>;
};

export type EmbeddedWidgetProps = {
  widget: EmbeddedWidgetType;
};

const log = Log.module('EmbedWidget.EmbeddedWidget');

export function EmbeddedWidget({ widget }: EmbeddedWidgetProps): JSX.Element {
  const { definition, fetch } = widget;
  const plugins = usePlugins();
  const plugin = useMemo(
    () =>
      [...plugins.values()]
        .filter(isWidgetPlugin)
        .find(p => [p.supportedTypes].flat().includes(definition.type)),
    [plugins, definition.type]
  );

  if (plugin != null) {
    const Component = plugin.component;
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component fetch={fetch as () => Promise<Widget>} />;
  }

  log.warn('Unknown object type', definition.type);
  return <div>Unknown object type: {definition.type}</div>;
}

export default EmbeddedWidget;
