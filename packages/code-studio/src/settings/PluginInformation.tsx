import React, { ReactElement } from 'react';
import { usePlugins } from '@deephaven/plugin';

export default function PluginInformation(): ReactElement {
  const plugins = usePlugins();
  return (
    <div>
      {Array.from(plugins.entries())
        .filter(plugin => plugin[1].version !== undefined)
        .map(([key, value]) => (
          <div key={key}>
            <p>{key}</p>
            <p>{value?.version ?? 'N/A'}</p>
          </div>
        ))}
    </div>
  );
}
