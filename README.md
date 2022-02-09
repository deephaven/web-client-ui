# Web Javascript packages

We're using a monorepo to manage our packages, as it becomes cumbersome to manage the overhead of multiple repos with how we wish to develop the Enterprise UI, while maintaining a separate OSS Code Studio solution. Using `lerna` to manage all of our packages in one repo simplifies the process.

[![codecov](https://codecov.io/gh/deephaven/web-client-ui/branch/main/graph/badge.svg?token=RW29S9X72C)](https://codecov.io/gh/deephaven/web-client-ui)

## Development Environment

We recommend using [Visual Studio Code](https://code.visualstudio.com/) and installing the recommended workspace extensions. There are a few workspace settings configured with the repo.

Use Chrome for debugging, install the React and Redux extensions.

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi): Allows inspection/changing the props/state of react components.
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en): Inspect the redux store data.

## Getting Started

We are still using node 14.x and npm 6.x. If you are [using nvm](https://github.com/nvm-sh/nvm#installing-and-updating), run `nvm install lts/fermium` to get the latest 14.x/6.x versions. Otherwise, download from the [node homepage](https://nodejs.org/en/download/).

- `npm install` : Install all dependencies and automatically bootstrap packages
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically.
- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.
- `npm run version-bump`: Update the version of all packages. Used when updating/tagging new versions. You'll need to select whether to do a [patch, minor, or major version](https://semver.org/). It does not commit the changes.

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

## Releasing a New Version

When releasing a new version, you need to commit a version bump, then tag and create the release. By creating the release, the [publish-packages action](.github/workflows/publish-packages.yml) will be triggered, and will automatically publish the packages. Some of these steps below also make use of the [GitHub CLI](https://github.com/cli/cli)

1. Bump the version:
   - Run `npm run version-bump`. Select the type of version bump ([patch, minor, or major version](https://semver.org/)). Remember the version for the next steps, and fill it in instead of `<version>` (should be in semver format with `v` prefix, e.g. `v0.7.1`).
   - Commit your changes. `git commit --all --message="Version Bump <version>"`
   - Create a pull request. `gh pr create --fill --web`
   - Approve the pull request and merge to `main`.
2. Generate the changelog:
   - Generate a [GitHub Personal access token](https://github.com/settings/tokens) with the `public_repo` scope. Copy this token and replace `<token>` with it below.
   - Generate the changelog: `GITHUB_AUTH=<token> npm run changelog --silent -- --next-version=<version> > /tmp/changelog_<version>.md`
3. Create the tag. Use the command line to create an annotated tag (lightweight tags will not work correctly with lerna-changelog): `git tag --annotate <version> --file /tmp/changelog_<version>.md`
4. Push the tag: `git push origin <version>`
5. Create the release: `gh release create <version> --notes-file ~/tmp/changelog_<version>.md --title <version>`

After the release is created, you can go to the [actions page](https://github.com/deephaven/web-client-ui/actions) to see the publish action being kicked off.

## Browser Support

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We try and maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/) as well.

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/web-client-ui/labels/firefox) or [safari](https://github.com/deephaven/web-client-ui/labels/safari) for a list of known browser compatibility issues before reporting the issue.
