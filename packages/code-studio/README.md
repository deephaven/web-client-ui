# Introduction

Code Studio is a web application that connects to a running [deephaven-core](https://github.com/deephaven/deephaven-core/) instance. You can quickly bring up a [Deephaven backend from pre-built images](https://deephaven.io/core/docs/tutorials/quickstart/#tldr). A few notes to get developers quickly up and running.

## Running

To start the Code Studio, run `npm install` and `npm start` in the root directory of this repository. See the [Getting Started](../../README.md#getting-started) section for more details.

## Project Settings

Project specific settings are stored in the `.env` file. There is also an `.env.development` file which is only
loaded in development builds, and `.env.development.local` which is only for local builds. For local development,
you should be modifying `.env.development.local`.
For more information on `.env`, see https://create-react-app.dev/docs/adding-custom-environment-variables#adding-development-environment-variables-in-env
Below are some of the common properties which are configurable in the `.env` file.

### REACT_APP_CORE_API_URL

One common setup is to override the API server URL to point to another server. For example, add the following block to `.env.development.local` to have `npm start` point to a remote server for the API:

```shell
REACT_APP_CORE_API_URL=https://www.myserver.com/jsapi
```

### REACT_APP_NOTEBOOKS_URL

One common setup is to override the API server URL to point to another server. For example, add the following block to `.env.development.local` to have `npm start` point to a remote server for the API:

```shell
REACT_APP_CORE_API_URL=https://www.myserver.com/notebooks
```

### DEEPHAVEN_LOG_LEVEL

Printing detailed logs when debugging can be handy. To enable the highest level of logging, set the log level in your `.env.development.local` file:

```shell
DEEPHAVEN_LOG_LEVEL=4
```

When running the unit tests, you often do not want any logs to be printed out. To disable the logs while running the unit tests, set the log level in your `.env.test.local` file:

```shell
DEEPHAVEN_LOG_LEVEL=-1
```

See [@deephaven/log](../log) for more details on the logger.

### REACT_APP_ENABLE_LOG_PROXY

Set to `true` or `false`

Turns on the logger proxy which captures log messages so users can easily export debug info for us. Enabling this will affect the line numbers shown in the console. Defaults to false in development and true in production.

In development, `DHLogProxy` and `DHLogHistory` are added to the window so they can be manipulated directly from the console if needed. `DHLogProxy.enable()` will capture and emit events for all logging events. `DHLogHistory.enable()` will attach event listeners to the `DHLogProxy` events. Both also have a `disable` method.

## Data Storage

There is the data for the current session stored in the local redux state (Redux Data), and data persisted between sessions is stored in browser storage.

### Redux Data

The application stores data locally for the current session using Redux. Take a look in the `src/redux/reducers/index.js` file for comments on the general structure and what's stored, and go into individual reducers to get the details about the data being stored.

You can also use the Chrome Redux DevTools to inspect live in a development or production environment: https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en

The state transitions are also logged in the browser developer console in develop builds.

### Workspace Data

Workspace data is stored in the browsers localStorage. See [LocalWorkspaceStorage](./src/dashboard/LocalWorkspaceStorage.ts) for implementation details.

## Mock API

While developing, you may want to test specific cases that can be cumbersome to test against a real stack. You can run the mock API implementation in `public/__mocks__/dh-core.js` by executing `npm run mock` command. This mock is also used for unit tests.
When new functions are added to the API, ideally stubs returning a generic success case should be added to the mock API as well to avoid breakage when running the mock.

## Styleguide/Component Development

When running in development mode (`npm run start`), a style guide is served up at http://localhost:4000/styleguide. Styleguide can be used to develop components. The styleguide displays many common components and how to use them. When creating a new component, it should be added to the [styleguide](./src/styleguide/).

## Architecture

For more details on the sockets and ports used, see [Network Services](https://docs.deephaven.io/latest/Content/runbook/OpsGuide.htm?Highlight=socket%20ports#Network_Services) and [Web API](https://docs.deephaven.io/latest/Content/systemAdmin/sec_webAPI.htm) in our docs.

### Dashboards

The main layout of the app is based on [Dashboards](src/dashboard/DashboardContainer.jsx), which is essentially a top level tab the user has open. Before a Dashboard is loaded, it is simply a [LazyDashboard](src/dashboard/LazyDashboardContainer.jsx). Once activated, it will load it's layout into Golden Layout. It's layout is composed of numerous Panels (see below).
Each DashboardContainer listens for [TabEvents](src/main/tabs/TabEvent.js) from the higher level app, and for panel events emitted on the [Golden Layout EventHub](https://golden-layout.com/tutorials/getting-started-react.html).

### Panels

Each Dashboard is composed of panels. There are many different kinds of panels, such as [IrisGridPanel](src/iris-grid/IrisGridPanel), [ChartPanel](src/chart/ChartPanel.jsx), [MarkdownPanel](src/controls/markdown/MarkdownPanel.jsx), and [ConsolePanel](src/console/ConsolePanel.jsx). Each panel should save a dehydrated state that can be serialized and saved in the database, then deserialized and hydrated when opening a dashboard. The dehydration/hydration step is defined in [DashboardContainer](src/dashboard/DashboardContainer.jsx) with `makeHydrateComponentPropsMap` and `dehydrateClosedComponentConfigMap`.

# Initial Project Setup

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `yarn build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify

# Legal Notices

Deephaven Data Labs and any contributors grant you a license to the content of this repository under the Apache 2.0 License, see the [LICENSE](../../LICENSE) file.
