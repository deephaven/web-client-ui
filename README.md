# Web Javascript packages

We're using a monorepo to manage our packages, as it becomes cumbersome to manage the overhead of multiple separate repos for each package. Using [lerna](https://github.com/lerna/lerna) to manage all of our packages in one repo simplifies the process.

[![codecov](https://codecov.io/gh/deephaven/web-client-ui/branch/main/graph/badge.svg?token=RW29S9X72C)](https://codecov.io/gh/deephaven/web-client-ui)

## Package Overview

There are many packages located in the [packages](./packages) directory. A few of the more important ones are:

- [@deephaven/code-studio](./packages/code-studio): Main web UI used with the [deephaven-core](https://github.com/deephaven/deephaven-core/) backend. This package is the main front-end application, and depends on almost all other packages in the repository. It is often the easiest way to see the effect of your changes by opening this application. Follow the instructions in the [code-studio README.md](https://github.com/deephaven/web-client-ui/blob/main/packages/code-studio/README.md) to get it started.
- [@deephaven/components](./packages/components): Component library used within the web UI.
- [@deephaven/grid](./packages/grid): High-performance grid component used to display large tables of data.
- [@deephaven/dashboard](./packages/dashboard/): Dashboards used in [@deephaven/code-studio](./packages/code-studio) for displaying and organizing panels.
- [@deephaven/golden-layout](./packages/golden-layout): Layout framework used in [@deephaven/dashboard](./packages/dashboard/).

## Contributing

For details on how to contribute to this repository, please see the [contributing guidelines](./CONTRIBUTING.md).

# Development

## Getting Started

We are using node 18.x and npm 8.x. If you are [using nvm](https://github.com/nvm-sh/nvm#installing-and-updating), there is an [.nvmrc](.nvmrc) file, so just run `nvm install` to get the latest 18.x/8.x versions (or set up your environment to [automatically switch](https://github.com/nvm-sh/nvm#deeper-shell-integration)). Otherwise, download from the [node homepage](https://nodejs.org/en/download/).

In order to use the UI, you must also be running a [deephaven-core](https://github.com/deephaven/deephaven-core) server on port 10000. The server provides APIs that the web-client-ui depends upon. An easy way to get started is to launch a Deephaven container from the [quick start guide](https://deephaven.io/core/docs/tutorials/quickstart/).

## Recommended Environment

We recommend using [Visual Studio Code](https://code.visualstudio.com/) and installing the [recommended workspace extensions](https://github.com/deephaven/web-client-ui/blob/main/.vscode/extensions.json) which VS Code will suggest when you open the repo or when you browse the extensions panel. There are a few [workspace settings](https://github.com/deephaven/web-client-ui/tree/main/.vscode) configured with the repo.

If using Linux, we recommend installing directly from the deb or rpm file from the VSCode website rather than through a package manager or store such as `snap` or `flatpak`. The other install methods (for example, apt on Ubuntu installs via snap) may end up in a sandboxed environment that cannot use the debug launch configs properly.

We use Chrome for development with the React and Redux extensions.

- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi): Allows inspection/changing the props/state of react components.
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en): Inspect the redux store data.

## Scripts

- `npm install` : Install all dependencies and automatically bootstrap packages. Should be run before any of the other steps.
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically.

  Log messages from our log package are disabled by default in tests in [jest.setup.ts](./jest.setup.ts). To change the log level, set the `DH_LOG_LEVEL` env variable. For example, to enable all log messages run `DH_LOG_LEVEL=4 npm test`.

  Note that log messages from other sources such as react prop types will still be printed since they do not go through our logger.

  If you want to collect coverage locally, run `npm test -- --coverage`

- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.
- `npm run preview`: Runs the Vite preview server for the built code-studio, embed-grid, and embed-chart. These will open on ports 4000, 4010, and 4020.
- `npm run e2e`: Runs the Playwright end-to-end tests locally.
- `npm run e2e:headed`: Runs end-to-end tests in headed mode debug mode. Useful if you need to debug why a particular test isn't work. For example, to debug the `table.spec.ts` test directly, you could run `npm run e2e:headed -- ./tests/table.spec.ts`.

If your DHC address is different from the default `http://localhost:10000`, edit `.env.local` in each package to point to your local DHC. This is needed for the session websocket and for things like notebooks to be proxied correctly by Vite.

```
VITE_PROXY_URL=http://<dhc-host>:<port>
```

## Debugging from VSCode

We have a pre-defined launch config that lets you set breakpoints directly in VSCode for debugging browser code. The `Launch Deephaven` config will launch a new Chrome window that stores its data in your repo workspace. With this setup, you only need to install the React and Redux devtool extensions once. They will persist to future launches using the launch config.

We prefer launching a new window instead of attaching to existing windows because it provides a cleaner debug environment (only development extensions). You would also need to launch Chrome with the remote debugging flag in order to attach to an existing instance.

### Linux

If you are using Linux, you will likely need to use the direct install from the VSCode website (deb or rpm file) and not through a package manager. On Ubuntu, apt installs via `snap` and some Linux flavors may use `flatpak`. Both of these sandbox the VSCode instance in such a way that the launch debug configs will likely not work.

If you are not using Chrome (e.g. Chromium), you may need to do one of the following if the launch config is not working.

1. Alias `google-chrome-stable` to launch `chromium-browser`. The launch config by default should try to launch `google-chrome-stable`, so if you can launch the browser with `google-chrome-stable` from a terminal, it should work.

2. Add a new configuration to VSCode and copy the launch config from [`settings.json`](./.vscode/settings.json). Then add the `runtimeExecutable` prop to point to your browser executable. VSCode unfortnuately does not merge workspace `settings.launch` with workspace `launch.json`, so if we add more launch configs you would need to copy to your `.vscode/launch.json` file to get the configs.

## Creating a New Package

Depending on what your package is, there are a couple of different templates that may be appropriate.

### Application package

A standalone application with it's own entry point. Recommend copying the [embed-grid](./packages/embed-grid/) package, removing any dependencies and files not required.

### Component/library package

A component/library package that can be imported into other packages. Recommend copying the [components](./packages/components/) package, removing any dependencies and files not required.

## Updating E2E Snapshots

**Note:** You must have [Docker installed](https://docs.docker.com/get-docker/), and `deephaven-core` must already be running on port 10000 with anonymous authentication on your local machine for all e2e tests. To enable anonymous authentication, pass the flag through `START_OPTS`, e.g.: `docker run --detach --publish 10000:10000 --name dh-core-server --env "START_OPTS=-Xmx4g -DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler" ghcr.io/deephaven/server:edge` or `START_OPTS="-DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler" ./gradlew server-jetty-app:run`.

Snapshots are used by end-to-end tests to visually verify the output. Sometimes changes are made requiring snapshots to be updated. Before running snapshots locally, you must be running the development server with `npm start` or have run `npm run build` recently. Run snapshots locally by running `npm run e2e:update-snapshots`.

Once you are satisfied with the snapshots and everything is passing locally, you need to use a docker image to [update snapshots for CI](https://playwright.dev/docs/test-snapshots) (unless you are running the same platform as CI (Ubuntu)). Run `npm run e2e:update-ci-snapshots` which will mount the current directory into a docker image and re-run the tests from there. Test results will be written to your local directories.

# Releases

All new changes (bug fixes, feature requests) are merged to `main` so they are always included in the latest release. We use semantic versioning for major/minor/patch releases.

We use 3 release types

- `stable` - Stable releases are created periodically off of the `main` with the dist-tag `latest`. These will include an appropriate version bump and [release notes](https://github.com/deephaven/web-client-ui/releases), detailing the changes that are in that version.

- `nightly` - Nightly releases are published every night with the dist-tag `nightly` to npm. You can reference the nightly release to always be on the latest by referencing `nightly` as the version, though stability is not guaranteed, e.g. `npm install --save @deephaven/grid@nightly`.

- `hotfix` - For Long Term Support releases (versions we consume in the enterprise product), we create a new branch in Community matching the LTS version number (e.g. [release/v0.6](https://github.com/deephaven/web-client-ui/tree/release/v0.6)). Bug fixes/hotfixes are then either cherry-picked from `main` (if the fix has been merged to main), or directly merged into the hotfix branch (if code has changed in `main` and the fix only applies in the hotfix branch).

- `alpha`/`other` - For publishing WIP branches to NPM or testing CI/publishing changes. There is a GitHub Action called `Publish Alpha` which will prompt you for a `preid` and `ref` to create the alpha version. These will publish to `npm` under the `canary` tag. The version number will be `x.yy.z-alpha.0` or using the `preid` specified.

## Releasing a New Version

**Note:** Only repo admins can do this. These steps apply to `main` and any `release/*` branches.

We use [lerna](https://github.com/lerna/lerna) and [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) to automatically handle incrementing the version, generate the changelog, and create the release.

1. Generate a [GitHub Personal access token](https://github.com/settings/tokens):

   - Under `Repository Access`, select `Only select repositories` and add `deephaven/web-client-ui`.

   - Under `Repository Permissions`, set `Access: Read and write` for `Contents`. This will be necessary to push your version bump and create the release.

   - Copy the token created and replace `<token>` with it in the next step.

2. Checkout the branch you want to release. `main` or `release/*`

3. Run this npm script to bump the version, update the changelog, and create a release on GitHub. If your local remote name for the upstream repo is not origin, then set the proper `git-remote` (e.g. `upstream`).

   `GH_TOKEN=<token> npm run version-bump -- --git-remote origin`

4. **IMPORTANT**: If releasing a `release/*` branch, you need to reset the `latest` tag on GitHub. To do that, go to the [releases page](https://github.com/deephaven/web-client-ui/releases) and find the release that is actually the `latest` based on the version `main` is on.

   - Click edit on the actual `latest` release

   - Check the box for `Set as the latest release`

   - Update release

   This ensures that an older version doesn't get marked as `latest` on GitHub. It will not effect npm.

After the release is created, you can go to the [actions page](https://github.com/deephaven/web-client-ui/actions) to see the publish action being kicked off.

## Creating a hotfix/LTS branch

**Note:** Only repo admins can do this since `release/*` branches are protected.

For our enterprise product, we occasinally need to make hotfixes (patch releases) to older versions that the enterprise client depends on. Since it would be unwise to update an old version of enterprise to the newest community UI components, we keep hotfix `release/*` branches. There are a few steps to create one.

1. Checkout the tag for the release where the branch should fork.

2. Create a new branch from this point called `release/vX.YY`. If forking from `v0.31.1` then the branch is `release/v0.31`.

3. Change the `distTag` in `lerna.json` to `vX.YY` which corresponds to the version from the branch name. This will ensure packages are published to npm under the `distTag` instead of the default of `latest`.

4. Commit and push the branch

Once the branch is pushed to origin, new commits will require PRs into the branch. To create a patch release, refer to the [Releasing a New Version](#releasing-a-new-version) section.

## Updating Dependencies

Periodically dependencies should be updated such that we're using the latest and greatest.

- Security updates: Run `npm audit fix` weekly to ensure any known security vulnerabilities are updated.
- Dependency updates: At the beginning of a release cycle, run `npm update` to update the `package-lock.json` with the latest version of dependencies. Afterwards, run `npm outdated` to see if there are any dependencies with major version changes that can be updated. There are two ways you can upgrade a dependency:
  - Run a tool like [lerna-update-wizard](https://github.com/Anifacted/lerna-update-wizard) by running `npx lerna-update-wizard` to go through steps to automatically update all child packages, OR
  - Manually update the `package.json` of all packages with that dependency to the latest version.
- When updating the major version of dependencies, be sure to check the release notes for any breaking changes/migration notes. After updating dependencies, run an `npm install` and `npm test` to make sure all tests pass.

## Analyzing Bundle Size

When adding new features, it can be useful to analyze the final package size to see what's in the package. Use [source-map-explorer](https://www.npmjs.com/package/source-map-explorer) to see what's taking up the most size in the package. First run `npm run build` to build a production bundle, then run `npx source-map-explorer 'packages/<package-name>/build/static/js/*.js'`, e.g.:

```
npm run build
npx source-map-explorer 'packages/code-studio/build/static/js/*.js'
```

## Browser Support

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We try and maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/) as well.

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/web-client-ui/labels/firefox) or [safari](https://github.com/deephaven/web-client-ui/labels/safari) for a list of known browser compatibility issues before reporting the issue.
