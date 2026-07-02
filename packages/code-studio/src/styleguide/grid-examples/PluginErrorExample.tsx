import React, { type ReactElement, useState } from 'react';
import { MockTreeGridModel } from '@deephaven/grid';
import {
  IrisGrid,
  type OptionItem,
  type TableOptionsTransform,
} from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import MockIrisGridTreeModel from '../MockIrisGridTreeModel';

/**
 * A plugin `configPage` that always throws, used to exercise
 * `PluginTableOptionsErrorBoundary` from an e2e test.
 */
function ThrowingConfigPage(): ReactElement {
  throw new Error('Intentional configPage error for error boundary test');
}

/**
 * Appends a plugin Table Options item whose `configPage` throws on render so
 * the sidebar error boundary fallback can be snapshotted in e2e tests.
 */
const transformTableOptionsWithError: TableOptionsTransform = (
  defaults: readonly OptionItem[]
) => [
  ...defaults,
  {
    type: 'plugin:e2e:throwing-page',
    title: 'Throwing Plugin Page',
    configPage: ThrowingConfigPage,
  },
];

/**
 * An IrisGrid whose Table Options include a plugin page that throws on render,
 * used to exercise `PluginTableOptionsErrorBoundary` from an e2e test.
 */
function PluginErrorExample(): ReactElement {
  const dh = useApi();
  const [model] = useState(
    () => new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  return (
    <IrisGrid
      model={model}
      density="regular"
      transformTableOptions={transformTableOptionsWithError}
    />
  );
}

export default PluginErrorExample;
