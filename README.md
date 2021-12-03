# Web Javascript packages

We're using a monorepo to manage our packages, as it becomes cumbersome to manage the overhead of multiple repos with how we wish to develop the Enterprise UI, while maintaining a separate OSS Code Studio solution. Using `lerna` to manage all of our packages in one repo simplifies the process.

[![codecov](https://codecov.io/gh/deephaven/web-client-ui/branch/main/graph/badge.svg?token=RW29S9X72C)](https://codecov.io/gh/deephaven/web-client-ui)

## Getting Started

We are still using node 14.x and npm 6.x. If you are [using nvm](https://github.com/nvm-sh/nvm#installing-and-updating), run `nvm install lts/fermium` to get the latest 14.x/6.x versions. Otherwise, download from the [node homepage](https://nodejs.org/en/download/).

- `npm install` : Install all dependencies and automatically bootstrap packages
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically.
- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.
- `npm run version-bump`: Update the version of all packages. Used when updating/tagging new versions. You'll need to select whether to do a [patch, minor, or major version](https://semver.org/). It does not commit the changes.
- `npm run publish-all`: Publish the current versions of the packages that have not yet been published. If all packages with the current version have already been published, does nothing. Should be done after doing an `npm version-bump` and committing/tagging the release.

## Package Overview

There are many packages located in the [packages](./packages) directory. A few of the more important ones are:

- [@deephaven/code-studio](./packages/code-studio): Main web UI used with the [deephaven-core](https://github.com/deephaven/deephaven-core/) backend.
- [@deephaven/components](./packages/components): Component library used within the web UI.
- [@deephaven/grid](./packages/grid): High-performance grid component used to display large tables of data.
- [@deephaven/golden-layout](./packages/golden-layout): Layout framework used in [@deephaven/code-studio](./packages/code-studio).

## Creating a New Package

Depending on what your package is, there are a couple of different templates that may be appropriate

### Application package

A standalone application with it's own entry point. Recommend using the [create-react-app template](https://github.com/facebook/create-react-app).

### Component/library package

Component template is located in `examples/component-template`. Use that template when making new component packages/libraries.

## Browser Support

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We try and maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/) as well.

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/web-client-ui/labels/firefox) or [safari](https://github.com/deephaven/web-client-ui/labels/safari) for a list of known browser compatibility issues before reporting the issue.
