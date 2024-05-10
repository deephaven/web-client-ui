import React, { ReactElement } from 'react';
import { usePlugins } from '@deephaven/plugin';

export default function PluginInformation(): ReactElement {
  const plugins = usePlugins();
  return (
    <div className="container">
      {Array.from(plugins.entries())
        .filter(plugin => plugin[1].version !== undefined)
        .map(([key, value]) => (
          <div
            key={key}
            className="row justify-content-start align-items-center"
          >
            <div className="col pl-0">
              <span className="my-0">{key}</span>
            </div>
            <div className="col-auto">
              <span>{value?.version}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
