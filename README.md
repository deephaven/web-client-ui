# Web Javascript packages

We're using a monorepo to manage our packages, as it becomes cumbersome to manage the overhead of multiple repos with how we wish to develop the Enterprise UI, while maintaining a separate OSS Code Studio solution. Using `lerna` to manage all of our packages in one repo simplifies the process.

## Getting Started

We are still using node 14.x and npm 6.x. If you are [using nvm](https://github.com/nvm-sh/nvm#installing-and-updating), run `nvm install lts/fermium` to get the latest 14.x/6.x versions. Otherwise, download from the [node homepage](https://nodejs.org/en/download/).

- `npm install` : Install all dependencies and automatically bootstrap packages
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically.
- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.
- `npm run sync-version`: Update the version of all packages to match `DEEPHAVEN_VERSION`. Used when updating/tagging new versions. It does not commit the changes.
- `npm run publish`: Publish the current versions of the packages that have not yet been published. If all packages with the current version have already been published, does nothing. Should be done after doing an `npm sync-version` and committing/tagging the release.

## Creating a New Package

Depending on what your package is, there are a couple of different templates that may be appropriate

### Application package

A standalone application with it's own entry point. Recommend using the [create-react-app template](https://github.com/facebook/create-react-app).

### Component/library package

Component template is located in `examples/component-template`. Use that template when making new component packages/libraries.

## Browser Support

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We try and maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/) as well.

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/core/labels/firefox) or [safari](https://github.com/deephaven/core/labels/safari) for a list of known browser compatibility issues before reporting the issue.