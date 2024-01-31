import React, { useEffect, useMemo, useState } from 'react';
import {
  ContextMenuRoot,
  ErrorBoundary,
  LoadingOverlay,
} from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import { getVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import type { VariableDescriptor } from '@deephaven/jsapi-types';
import { fetchVariableDefinition } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { WidgetView } from '@deephaven/plugin';
import './App.scss'; // Styles for in this app

const log = Log.module('EmbedWidget.App');

/**
 * A functional React component that displays a Deephaven Widget using the @deephaven/plugin package.
 * It will attempt to open and display the widget specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:4030/?name=myWidget will attempt to open a widget `myWidget`
 * If no query param is provided, it will display an error.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:10000/jsapi
 * See Vite docs for how to update these env vars: https://vitejs.dev/guide/env-and-mode.html
 */
function App(): JSX.Element {
  const [error, setError] = useState<string>();
  const [descriptor, setDescriptor] = useState<VariableDescriptor>();
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  // Get the widget name from the query param `name`.
  const name = searchParams.get('name');
  const connection = useConnection();

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          if (name == null) {
            throw new Error('Missing URL parameter "name"');
          }

          log.debug(`Loading widget descriptor for ${name}...`);

          const newDefinition = await fetchVariableDefinition(connection, name);

          setDescriptor(getVariableDescriptor(newDefinition));

          log.debug(`Widget descriptor successfully loaded for ${name}`);
        } catch (e: unknown) {
          log.error(`Unable to load widget descriptor for ${name}`, e);
          setError(`${e}`);
        }
      }
      initApp();
    },
    [connection, name]
  );

  const isLoaded = descriptor != null && error == null;
  const isLoading = descriptor == null && error == null;

  const fetch = useMemo(() => {
    if (descriptor == null) {
      return async () => {
        throw new Error('Definition is null');
      };
    }
    return () => connection.getObject(descriptor);
  }, [connection, descriptor]);

  return (
    <div className="App">
      {isLoaded && (
        <ErrorBoundary>
          <WidgetView type={descriptor.type} fetch={fetch} />
        </ErrorBoundary>
      )}
      {!isLoaded && (
        <LoadingOverlay
          isLoaded={isLoaded}
          isLoading={isLoading}
          errorMessage={error ?? null}
        />
      )}
      <ContextMenuRoot />
    </div>
  );
}

export default App;
