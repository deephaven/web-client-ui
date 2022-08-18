# Web Javascript packages

We're using a monorepo to manage our packages, as it becomes cumbersome to manage the overhead of multiple separate repos for each package. Using [lerna](https://github.com/lerna/lerna) to manage all of our packages in one repo simplifies the process.

[![codecov](https://codecov.io/gh/deephaven/web-client-ui/branch/main/graph/badge.svg?token=RW29S9X72C)](https://codecov.io/gh/deephaven/web-client-ui)

## Development Environment

We recommend using [Visual Studio Code](https://code.visualstudio.com/) and installing the [recommended workspace extensions](https://github.com/deephaven/web-client-ui/blob/main/.vscode/extensions.json) which VS Code will suggest when you open the repo or when you browse the extensions panel. There are a few [workspace settings](https://github.com/deephaven/web-client-ui/tree/main/.vscode) configured with the repo.

Use Chrome for debugging, install the React and Redux extensions.

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi): Allows inspection/changing the props/state of react components.
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en): Inspect the redux store data.

## Getting Started

We are still using node 16.x and npm 8.x. If you are [using nvm](https://github.com/nvm-sh/nvm#installing-and-updating), there is an [.nvmrc](.nvmrc) file, so just run `nvm install` to get the latest 16.x/8.x versions (or set up your environment to [automatically switch](https://github.com/nvm-sh/nvm#deeper-shell-integration)). Otherwise, download from the [node homepage](https://nodejs.org/en/download/).

### Scripts

- `npm install` : Install all dependencies and automatically bootstrap packages. Should be run before any of the other steps.
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically.

  Log messages from our log package are disabled by default in tests in [jest.setup.ts](./jest.setup.ts). To change the log level, set the `DH_LOG_LEVEL` env variable. For example, to enable all log messages run `DH_LOG_LEVEL=4 npm test`.

  Note that log messages from other sources such as react prop types will still be printed since they do not go through our logger.

  If you want to collect coverage locally, run `npm test -- --coverage`

- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.

## Package Overview

There are many packages located in the [packages](./packages) directory. A few of the more important ones are:

- [@deephaven/code-studio](./packages/code-studio): Main web UI used with the [deephaven-core](https://github.com/deephaven/deephaven-core/) backend. This package is the main front-end application, and depends on almost all other packages in the repository. It is often the easiest way to see the effect of your changes by opening this application. Follow the instructions in the [code-studio README.md](https://github.com/deephaven/web-client-ui/blob/main/packages/code-studio/README.md) to get it started.
- [@deephaven/components](./packages/components): Component library used within the web UI.
- [@deephaven/grid](./packages/grid): High-performance grid component used to display large tables of data.
- [@deephaven/dashboard](./packages/dashboard/): Dashboards used in [@deephaven/code-studio](./packages/code-studio) for displaying and organizing panels.
- [@deephaven/golden-layout](./packages/golden-layout): Layout framework used in [@deephaven/dashboard](./packages/dashboard/).

## Contributing

For details on how to contribute to this repository, please see the [contributing guidelines](https://github.com/deephaven/web-client-ui/blob/main/CONTRIBUTING.md).

## Creating a New Package

Depending on what your package is, there are a couple of different templates that may be appropriate.

### Application package

A standalone application with it's own entry point. Recommend using the [create-react-app template](https://github.com/facebook/create-react-app) with TypeScript enabled.

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
5. Create the release: `gh release create <version> --notes-file /tmp/changelog_<version>.md --title <version>`

After the release is created, you can go to the [actions page](https://github.com/deephaven/web-client-ui/actions) to see the publish action being kicked off.

## Browser Support

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We try and maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/) as well.

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/web-client-ui/labels/firefox) or [safari](https://github.com/deephaven/web-client-ui/labels/safari) for a list of known browser compatibility issues before reporting the issue.

## Release Strategy

All new changes (bug fixes, feature requests) are merged to `main` so they are always included in the latest release.

### Stable Releases

Stable releases are created periodically off of the `main` with the dist-tag `latest`. These will include an appropriate version bump and [release notes](https://github.com/deephaven/web-client-ui/releases), detailing the changes that are in that version.

### Nightly Releases

Nightly releases are published every night with the dist-tag `nightly` to npm. You can reference the nightly release to always be on the latest by referencing `nightly` as the version, though stability is not guaranteed, e.g. `npm install --save @deephaven/grid@nightly`.

### Hotfix Releases

For Long Term Support releases, we create a new branch in Community matching the LTS version number (e.g. [v0.6](https://github.com/deephaven/web-client-ui/tree/v0.6)), then adding a matching [dist-tag](https://github.com/lerna/lerna/blob/main/commands/publish/README.md#--dist-tag-tag) to the [publish-packages.yml](.github/workflows/publish-packages.yml#L24) for that branch. Bug fixes/hotfixes are then either cherry-picked from `main` (if the fix has been merged to main), or directly merged into the hotfix branch (if code has changed in `main` and the fix only applies in the hotfix branch). Once the branch is pushed to origin, the publish step is kicked off by creating a release as instructed in the [Releasing a New Version](#releasing-a-new-version) section.
