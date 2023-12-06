import React, { useEffect, useMemo, useState } from 'react';
import {
  ContextMenuRoot,
  ErrorBoundary,
  LoadingOverlay,
} from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import type { VariableDefinition } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import './App.scss'; // Styles for in this app
import { useConnection } from '@deephaven/jsapi-components';
import { fetchVariableDefinition } from '@deephaven/jsapi-utils';
import { WidgetView } from '@deephaven/plugin';

const log = Log.module('EmbedWidget.App');

/**
 * A functional React component that displays a Deephaven Widget using the @deephaven/plugin package.
 * It will attempt to open and display the widget specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:4030/?name=myWidget will attempt to open a widget `myWidget`
 * If no query param is provided, it will display an error.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:10000/jsapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App(): JSX.Element {
  const [error, setError] = useState<string>();
  const [definition, setDefinition] = useState<VariableDefinition>();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const connection = useConnection();

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          // Get the widget name from the query param `name`.
          const name = searchParams.get('name');

          if (name == null) {
            throw new Error('Missing URL parameter "name"');
          }

          log.debug(`Loading widget definition for ${name}...`);

          const newDefinition = await fetchVariableDefinition(connection, name);

          setDefinition(newDefinition);

          log.debug(`Widget definition successfully loaded for ${name}`);
        } catch (e: unknown) {
          log.error(`Unable to load widget definition for ${name}`, e);
          setError(`${e}`);
        }
        setIsLoading(false);
      }
      initApp();
    },
    [connection, searchParams]
  );

  const isLoaded = definition != null;

  const fetch = useMemo(() => {
    if (definition == null) {
      return async () => {
        throw new Error('Definition is null');
      };
    }
    return () => connection.getObject(definition);
  }, [connection, definition]);

  return (
    <div className="App">
      {isLoaded && (
        <ErrorBoundary>
          <WidgetView type={definition.type} fetch={fetch} />
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
