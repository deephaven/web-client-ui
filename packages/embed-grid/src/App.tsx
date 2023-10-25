import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@deephaven/app-utils';
import { useConnection } from '@deephaven/jsapi-components';
import { ContextMenuRoot, LoadingOverlay } from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import {
  InputFilter,
  IrisGrid,
  IrisGridModel,
  IrisGridModelFactory,
} from '@deephaven/iris-grid'; // iris-grid is used to display Deephaven tables
import dh from '@deephaven/jsapi-shim'; // Import the shim to use the JS API
import type { IdeConnection, Sort, Table } from '@deephaven/jsapi-types';
import { fetchVariableDefinition } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import './App.scss'; // Styles for in this app

Log.setLogLevel(parseInt(import.meta.env.VITE_LOG_LEVEL ?? '', 10));

const log = Log.module('EmbedGrid.App');

const SUPPORTED_TYPES: string[] = [
  dh.VariableType.TABLE,
  dh.VariableType.TREETABLE,
  dh.VariableType.HIERARCHICALTABLE,
  dh.VariableType.PANDAS,
];

export type Command = 'filter' | 'sort';

/** Input value for filter commands */
export type FilterCommandType = {
  name: string;
  value: string;
};

export type SortCommandType = {
  name: string;
  direction?: 'ASC' | 'DESC';
};

/**
 * Load an existing Deephaven table with the connection provided
 * @param connection The Deephaven session object
 * @param name Name of the table to load
 * @param type The type of table to load
 * @returns Deephaven table
 */
async function loadTable(
  connection: IdeConnection,
  name: string
): Promise<Table> {
  log.info(`Fetching table ${name}...`);

  const definition = await fetchVariableDefinition(connection, name);
  if (!SUPPORTED_TYPES.includes(definition.type)) {
    throw new Error(
      `Unsupported type '${definition.type}' for variable named '${name}'`
    );
  }
  const object = await connection.getObject(definition);
  return object as Table;
}

/**
 * A functional React component that displays a Deephaven table in an IrisGrid using the @deephaven/iris-grid package.
 * It will attempt to open and display the table specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:3000/?name=myTable will attempt to open a table `myTable`
 * If no query param is provided, it will attempt to open a new session and create a basic time table and display that.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:1000/jsapi
 * See create-react-app docs for how to update these env vars: https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
function App(): JSX.Element {
  const connection = useConnection();
  const user = useUser();
  const [model, setModel] = useState<IrisGridModel>();
  const [error, setError] = useState<string>();
  const [inputFilters, setInputFilters] = useState<InputFilter[]>();
  const [sorts, setSorts] = useState<Sort[]>();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const { permissions } = user;
  const { canCopy, canDownloadCsv } = permissions;

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          // Get the table name from the query param `name`.
          const name = searchParams.get('name');
          if (name == null) {
            throw new Error('No name param provided');
          }
          log.debug('Loading table', name, '...');
          // Load the table up.
          const table = await loadTable(connection, name);
          // Create the `IrisGridModel` for use with the `IrisGrid` component
          log.debug(`Creating model...`);
          const newModel = await IrisGridModelFactory.makeModel(dh, table);
          setModel(newModel);
          log.debug('Table successfully loaded!');
        } catch (e: unknown) {
          log.error('Unable to load table', e);
          setError(`${e}`);
        }
        setIsLoading(false);
      }
      initApp();
    },
    [connection, searchParams]
  );

  useEffect(
    function initCommandListener() {
      function receiveMessage(e: MessageEvent): void {
        const { command, value } = e.data as {
          command: Command;
          value: unknown;
        };
        switch (command) {
          case 'filter': {
            const filterCommandValues = value as FilterCommandType[];
            const newInputFilters = filterCommandValues.map(
              ({ name, value: filterValue }) => {
                const column = model?.columns.find(c => c.name === name);
                if (column == null) {
                  throw new Error(`Could not find column named ${name}`);
                }
                return {
                  name,
                  value: filterValue,
                  type: column.type,
                };
              }
            );
            setInputFilters(newInputFilters);
            break;
          }
          case 'sort': {
            const sortCommandValues = value as SortCommandType[];
            const newSorts = sortCommandValues.map(({ name, direction }) => {
              const column = model?.columns.find(c => c.name === name);
              if (column == null) {
                throw new Error(`Could not find column named ${name}`);
              }
              return direction === 'DESC'
                ? column.sort().desc()
                : column.sort().asc();
            });
            setSorts(newSorts);
            break;
          }
        }
      }
      window.addEventListener('message', receiveMessage);

      return () => {
        window.removeEventListener('message', receiveMessage);
      };
    },
    [model]
  );

  const isLoaded = model != null;

  return (
    <div className="App">
      {isLoaded && (
        <IrisGrid
          canCopy={canCopy}
          canDownloadCsv={canDownloadCsv}
          model={model}
          inputFilters={inputFilters}
          sorts={sorts}
        />
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
