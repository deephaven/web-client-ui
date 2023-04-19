import React, { useEffect, useMemo, useState } from 'react';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart'; // chart is used to display Deephaven charts
import { ContextMenuRoot, LoadingOverlay } from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import dh, { IdeConnection } from '@deephaven/jsapi-shim'; // Import the shim to use the JS API
import Log from '@deephaven/log';
import './App.scss'; // Styles for in this app
import { useConnection } from '@deephaven/app-utils';

const log = Log.module('EmbedChart.App');

/**
 * Load an existing Deephaven figure with the connection provided
 * @param connection The Deephaven session object
 * @param name Name of the figure to load
 * @returns Deephaven figure
 */
async function loadFigure(connection: IdeConnection, name: string) {
  log.info(`Fetching figure ${name}...`);

  const definition = { name, type: dh.VariableType.FIGURE };
  return connection.getObject(definition);
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
  const [model, setModel] = useState<ChartModel>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const connection = useConnection();

  useEffect(
    function initializeApp() {
      async function initApp() {
        try {
          // Get the table name from the query param `name`.
          const name = searchParams.get('name');

          if (name == null) {
            throw new Error('No name param provided');
          }

          log.debug('Loading figure', name, '...');

          // Load the figure up.
          const figure = await loadFigure(connection, name);

          // Create the `ChartModel` for use with the `Chart` component
          log.debug(`Creating model...`);

          const newModel = await ChartModelFactory.makeModel(undefined, figure);

          setModel(newModel);

          log.debug('Figure successfully loaded!');
        } catch (e: unknown) {
          log.error('Unable to load figure', e);
          setError(`${e}`);
        }
        setIsLoading(false);
      }
      initApp();
    },
    [connection, searchParams]
  );

  const isLoaded = model != null;

  return (
    <div className="App">
      {isLoaded && <Chart model={model} />}
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
