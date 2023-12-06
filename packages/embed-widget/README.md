# Embedded Deephaven Widget

This project uses [Vite](https://vitejs.dev/guide/). It is to provide an example React application connecting to Deephaven and displaying a widget.

## Getting Started

1. **Start the server**: Following instructions on GitHub to run deephaven-core with python: https://github.com/deephaven/deephaven-core/#run-deephaven.
2. **Install dependencies**: Run `npm install` to install all dependencies required.
3. **Start the UI**: Run `npm start` to start up the UI. It should automatically open up at http://localhost:4030.

## Query Parameters

- `name`: Required. The name of the widget to load

## Advanced

### Application Mode

See the guide for how to set up core in Application Mode: https://deephaven.io/core/docs/how-to-guides/application-mode/

Once Deephaven is running, you can open a widget with a specific name by adding the query param `name`, e.g. http://localhost:4030/?name=world

### Configuring Server Address

By default, this project assumes you are hosting Deephaven with Python on the default port at http://localhost:10000. If Deephaven is running on a different port/server, update the `VITE_CORE_API_URL` environment variable to point to the correct server. See [.env](./.env) file for the default definition, and [vite docs](https://vitejs.dev/guide/env-and-mode.html#env-variables-and-modes) for other ways to set this environment variable.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:4030](http://localhost:4030) to view it in the browser.

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
