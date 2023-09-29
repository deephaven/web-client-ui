# Embedded Deephaven Grid

This project uses [Vite](https://vitejs.dev/). It is to provide an example React application connecting to Deephaven and displaying a table of data.

## Getting Started

1. **Start the server**: Following instructions on GitHub to run deephaven-core with python: https://github.com/deephaven/deephaven-core/#run-deephaven.
2. **Install dependencies**: Run `npm install` to install all dependencies required.
3. **Start the UI**: Run `npm start` to start up the UI. It should automatically open up at http://localhost:4010.

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

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:4010](http://localhost:4010) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Vite documentation](https://vitejs.dev/guide/).

To learn React, check out the [React documentation](https://reactjs.org/).
