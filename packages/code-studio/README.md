# Introduction

Code Studio is a web application that connects to a running [deephaven-core](https://github.com/deephaven/deephaven-core/) instance. A few notes to get developers quickly up and running.

## Running

To start the Code Studio, run `npm install` and `npm start` in the root directory of this repository. See the [Getting Started](../../#getting-started) section for more details.

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

## Development Environment

[Visual Studio Code](https://code.visualstudio.com/) is recommended for code editing. We use some extensions to help our development:

- [Prettier](https://github.com/prettier/prettier-vscode): Automatically formats code to our style. Enable the `formatOnSave` option to auto format when saving. Also set the Editor:Default Formatter to `ebsenp.prettier-vscode`
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint): Identifies linting errors, gives options to fix them automatically.
- [stylelint](https://marketplace.visualstudio.com/items?itemName=shinnn.stylelint): Identifies scss lint errors.
- [SCSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=mrmlnc.vscode-scss): Autocomplete for SCSS files
- [Debugger for Chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome): Set up debugging in Chrome.

Use Chrome for debugging, install the React and Redux extensions.

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi): Allows inspection/changing the props/state of react components.
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en): Inspect the redux store data.

VSCode Typescript Version Settings

- Open a TS file. In the bottom right of VSCode you will see "Typescript #.#.#". Click on the version number > Select Typescript Version > Use Workspace Version. This ensures Intellisense matches the TS version and features we compile against.

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

The styleguide uses [Storybook](https://storybook.js.org/) and can be accessed using `npm run storybook`. This runs independently of the dev server. Storybook can be used to develop components in isolation. The styleguide displays many common components and how to use them. When creating a new component, it should be added to the styleguide to show usage using a `component.stories.jsx` file.

### Legacy Style Guide

When running in development mode (`npm run start`), a style guide is served up at http://localhost:4000/styleguide. This is for legacy purposes now while everything is ported over to Storybook. Do NOT add new components to this styleguide, only use it for reference if things are missing in Storybook.

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
