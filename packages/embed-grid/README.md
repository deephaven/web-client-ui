# Embedded Deephaven Grid

This project uses [Vite](https://vitejs.dev/). It is to provide an example React application connecting to Deephaven and displaying a table of data.

## Running

To start the Embed Grid server, run `npm install` and `npm start` in the root directory of this repository. See the [Getting Started](../../README.md#getting-started) section for more details.

## Query Parameters

- `name`: Required. The name of the table to load

## Usage

You simply need to provide the URL to embed the iframe. Also add the `clipboard-write` permission to allow copying when embedded, e.g.:

```
<html>
  <body>
    <h1>Dev</h1>
    <iframe
      src="http://localhost:4010/?name=t"
      width="800"
      height="500"
      allow="clipboard-write"
    ></iframe>
  </body>
</html>
```

## API

The iframe provides an API to perform some basic actions with the table loaded. Use by posting the command/value as a [postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to the `contentWindow` of the iframe element, e.g. `document.getElementById('my-iframe').contentWindow.postMessage({ command, value }, 'http://localhost:4010')`

### Filtering

Command: `filter`
Value: `{ name: string; value: string }[]` - Provide an array of column name and quick filter values to set.
Example: `document.getElementById('my-iframe').contentWindow.postMessage({ command: 'filter', value: [{ name: 'A', value: '>50' }, { name: 'B', value: '<4' } ] }, 'http://localhost:4010')`

### Sorting

Command: 'sort'
Value: `{ name: string, direction?: 'ASC' | 'DESC' }[]` - Provide an array of column names to sort on, and optionally the sort direction (defaults to `'ASC'`);
Example: `document.getElementById('my-iframe').contentWindow.postMessage({ command: 'sort', value: [{ name: 'A' }, { name: 'B', direction: 'DESC' } ] }, 'http://localhost:4010')`

## Advanced

### Application Mode

See the guide for how to set up core in Application Mode: https://deephaven.io/core/docs/how-to-guides/application-mode/

Once Deephaven is running, you can open a table with a specific name by adding the query param `name`, e.g. http://localhost:4010/?name=world

### Configuring Server Address

By default, this project assumes you are hosting Deephaven with Python on the default port at http://localhost:10000. If Deephaven is running on a different port/server, update the `VITE_CORE_API_URL` environment variable to point to the correct server. See [.env](./.env) file for the default definition, and [Vite docs](https://vitejs.dev/guide/env-and-mode.html) for other info about environment variables.
