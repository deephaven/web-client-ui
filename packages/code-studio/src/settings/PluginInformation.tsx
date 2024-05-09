import React from 'react';
import { usePlugins } from '@deephaven/plugin';

export default function PluginInformation(): JSX.Element {
  const plugins = usePlugins();
  return (
    <>
      {Array.from(plugins.entries()).map(([key, value]) => (
        <div key={key}>
          <p>{key}</p>
          <p>{value}</p>
        </div>
      ))}
    </>
  );
}
