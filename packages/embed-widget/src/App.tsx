import React, { useEffect, useMemo, useState } from 'react';
import { ContextMenuRoot, LoadingOverlay } from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import type { dh as DhType, IdeConnection } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import './App.scss'; // Styles for in this app
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import EmbeddedWidget, { EmbeddedWidgetType } from './EmbeddedWidget';

const log = Log.module('EmbedWidget.App');

/**
 * Load an existing Deephaven widget with the connection provided
 * @param dh JSAPI instance
 * @param connection The Deephaven Connection object
 * @param name Name of the widget to load
 * @returns Deephaven widget
 */
async function loadWidget(
  dh: DhType,
  connection: IdeConnection,
  name: string
): Promise<EmbeddedWidgetType> {
  log.info(`Fetching widget ${name}...`);

  const definition = await connection.getVariableDefinition(name);
  const fetch = () => connection.getObject(definition);
  return { definition, fetch };
}

/**
 * A functional React component that displays a Deephaven figure using the @deephaven/chart package.
 * It will attempt to open and display the figure specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:3000/?name=myFigure will attempt to open a figure `myFigure`
 * If no query param is provided, it will display an error.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:10000/jsapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App(): JSX.Element {
  const [error, setError] = useState<string>();
  const [embeddedWidget, setEmbeddedWidget] = useState<EmbeddedWidgetType>();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const connection = useConnection();
  const dh = useApi();

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          // Get the table name from the query param `name`.
          const name = searchParams.get('name');

          if (name == null) {
            throw new Error('No name param provided');
          }

          log.debug('Loading widget', name, '...');

          // Load the widget.
          const newWidget = await loadWidget(dh, connection, name);

          setEmbeddedWidget(newWidget);

          log.debug('Widget successfully loaded!');
        } catch (e: unknown) {
          log.error('Unable to load figure', e);
          setError(`${e}`);
        }
        setIsLoading(false);
      }
      initApp();
    },
    [dh, connection, searchParams]
  );

  const isLoaded = embeddedWidget != null;

  return (
    <div className="App">
      {isLoaded && <EmbeddedWidget widget={embeddedWidget} />}
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
