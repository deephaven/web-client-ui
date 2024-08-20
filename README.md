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
- `npm start`: Start building all packages and watching them (when possible). Use when you're developing, and your changes will be picked up automatically. Servers will open up for code-studio and embed-widget. These will open on localhost on ports 4000 and 4010 respectively.
- `npm test`: Start running tests in all packages and watching (when possible). Use when you're developing, and any breaking changes will be printed out automatically. See [Unit tests](#unit-tests) for more details.
- `npm run build`: Create a production build of all packages. Mainly used by CI when packaging up a production version of the app.
- `npm run preview`: Runs the Vite preview server for the built code-studio and embed-widget. These will open on ports 4000 and 4010 respectively.
- `npm run e2e`: Runs the Playwright end-to-end tests locally. See [E2E Tests](#e2e-tests) for more details.

If your DHC address is different from the default `http://localhost:10000`, edit `.env.local` in each package to point to your local DHC. This is needed for the session websocket and for things like notebooks to be proxied correctly by Vite.

```
VITE_PROXY_URL=http://<dhc-host>:<port>
```

## Local Plugin Development

The plugins repo supports [serving plugins locally](https://github.com/deephaven/deephaven-plugins/blob/main/README.md#serve-plugins). DHC can be configured to proxy `js-plugins`requests to the local dev server by setting `VITE_JS_PLUGINS_DEV_PORT` in `packages/code-studio/.env.development.local`.

e.g. To point to the default dev port:

```
VITE_JS_PLUGINS_DEV_PORT=4100
```

## Local Vite Config

If you'd like to override the vite config for local dev, you can define a `packages/code-studio/vite.config.local.ts` file that extends from `vite.config.ts`. This file is excluded via `.gitignore` which makes it easy to keep local overrides in tact.

The config can be used by running:

`npm run start:app -- -- -- --config=vite.config.local.ts`

For example, to proxy `js-plugins` requests to a local server, you could use this `vite.config.local.ts`:

```typescript
export default defineConfig((config: ConfigEnv) => {
  const baseConfig = (createBaseConfig as UserConfigFn)(config) as UserConfig;

  return {
    ...baseConfig,
    server: {
      ...baseConfig.server,
      proxy: {
        ...baseConfig.server?.proxy,
        '/js-plugins': {
          target: 'http://localhost:5173',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/js-plugins/, ''),
        },
      },
    },
  };
});
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

A standalone application with it's own entry point. Recommend copying the [embed-widget](./packages/embed-widget/) package, removing any dependencies and files not required.

### Component/library package

A component/library package that can be imported into other packages. Recommend copying the [components](./packages/components/) package, removing any dependencies and files not required.

## Unit Tests

We use [Jest](https://jestjs.io/) for running unit tests. We use an eslint runner in Jest to lint files as tests. We also use [react-testing-library](https://testing-library.com/docs/react-testing-library/intro/) and [react-hooks-testing-library](https://react-hooks-testing-library.com/) for testing react components and hooks.

Run `npm test` to start Jest in watch mode. By default, this will only run tests that have changed relative to your git origin/main. Keeping your origin/main up to date will help keep the number of tests run to a minimum.

While the tests are running, you can press `p` to filter by filename or test name. You can also press `Shift+P` to see a list of projects and disable certain projects like the eslint or stylelint.

Log messages from our @deephaven/log package are disabled by default in tests in [jest.setup.ts](./jest.setup.ts). To change the log level, set the `DH_LOG_LEVEL` env variable. For example, to enable all log messages run `DH_LOG_LEVEL=4 npm test`.

Note that log messages from other sources such as react prop types will still be printed since they do not go through our logger.

If you want to collect coverage locally, run `npm test -- --coverage`

### Debugging Unit Tests

Unit tests can be debugged by running jest with the `--inspect-brk` flag and attaching to the node process in vscode's debugger. There are 2 launch configs that make this easier:

- Debug Jest Tests - This will prompt you for a test name or pattern and will then run tests in watch mode with an attached debugger.
- Attach to Node Process - This will attempt to attach to an existing node process running with `--inspect-brk`. There is an npm script `test:debug` that can start the process for you. By default, it will run with the same configuration as `npm test`, but you can supply additional parameters to narrow the scope of tests being run.

  e.g. `npm run test:debug ThemeUtils` would only run modules with "ThemeUtils" in the name.

## E2E Tests

We use [Playwright](https://playwright.dev/) for end-to-end tests. We test against Chrome, Firefox, and Webkit (Safari). Snapshots from E2E tests are only run against Linux so they can be validated in CI.

You should be able to pass arguments to these commands as if you were running Playwright via CLI directly. For example, to test only `table.spec.ts` you could run `npm run e2e -- ./tests/table.spec.ts`, or to test only `table.spec.ts` in Firefox, you could run `npm run e2e -- --project firefox ./tests/table.spec.ts`. See [Playwright CLI](https://playwright.dev/docs/test-cli) for more details.

Snapshots are used by end-to-end tests to visually verify the output. Snapshots are both OS and browser specific. Sometimes changes are made requiring snapshots to be updated. Update snapshots locally by running `npm run e2e:update-snapshots`.

Once you are satisfied with the snapshots and everything is passing locally, you need to use the docker image to update snapshots for CI (unless you are running the same platform as CI (Ubuntu)). Run `npm run e2e:update-ci-snapshots` to update the CI snapshots. The snapshots will be written to your local directories. The Linux snapshots should be committed to git (non-Linux snapshots should be automatically ignored by git).

### Differences in CI vs Local Docker Environments

Note that while both the GH actions and docker configuration use Ubuntu 22.04 images, their configurations are not identical. One known difference is the available system fonts. In some cases this can cause snapshots to differ when running locally vs in CI such as when rendering unicode characters. To mitigate this, some of our e2e tests have been configured to ensure a consistent unicode font fallback.

- The `DejaVu Sans` font gets installed via the [Dockerfile](tests/docker-scripts/Dockerfile). It already exists in the CI environment.
- Font family stacks that involve unicode characters can explicitly fallback to `DejaVu Sans` if they impact snapshots. e.g We do so in [Grids.tsx](packages/code-studio/src/styleguide/Grids.tsx) by setting the canvas font to `12px Arial, "DejaVu Sans", sans-serif`

### Local

These scripts are recommended while developing your tests as they will be quicker to iterate and offer headed mode for debugging. You will need to run `npx playwright install` before using these scripts. You may also need to update the browsers with the same command any time the Playwright version is updated. See [Playwright Browsers](https://playwright.dev/docs/browsers) for more details.

You must have a web UI running on `localhost:4000/ide/` (dev mode and build preview are both fine), and `deephaven-core` running on port 10000 with anonymous authentication for E2E tests and application mode using the [./tests/docker-scripts/data/app.d](./tests/docker-scripts/data/app.d/) folder. For example, the command you would run from the deephaven-core repo would be (replacing the path to point to the app.d directory on your machine):

```
START_OPTS="-DAuthHandlers=io.deephaven.auth.AnonymousAuthenticationHandler -Ddeephaven.application.dir=/path/to/web-client-ui/tests/docker-scripts/data/app.d" ./gradlew server-jetty-app:run
```

See [this guide](https://deephaven.io/core/docs/how-to-guides/authentication/auth-anon/) for more details on anonymous authentication.

- `npm run e2e`: Run end-to-end tests in headless mode.
- `npm run e2e:headed`: Runs end-to-end tests in headed debug mode. Also ignores snapshots since a test suite will stop once 1 snapshot comparison fails. Useful if you need to debug why a particular test isn't working. For example, to debug the `table.spec.ts` test directly, you could run `npm run e2e:headed -- ./tests/table.spec.ts`.
- `npm run e2e:codegen`: Runs Playwright in codegen mode which can help with creating tests. See [Playwright Codegen](https://playwright.dev/docs/codegen/) for more details.
- `npm run e2e:update-snapshots`: Updates the E2E snapshots for your local OS.

### Docker

These scripts will create a production build from your current code and run the tests in a Docker image. There is no need to install any other dependencies or have any other services running as they are all contained within Docker. Since any source code changes will require a new build, these scripts are only recommended if having issues with CI or if you need to update the snapshots for CI.

- `npm run e2e:docker`: Runs the E2E tests in a docker image. This is useful for testing how tests _should_ run in the CI environment locally.
- `npm run e2e:update-ci-snapshots`: Updates the E2E snapshots for CI.

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

Support is best for [Google Chrome](https://www.google.com/intl/en_ca/chrome/) and Chromium based browsers (such as [Microsoft Edge based on Chromium](https://www.microsoft.com/en-us/edge)). We also maintain compatibility with [Mozilla Firefox](https://www.mozilla.org/en-CA/firefox/new/) and [Apple Safari](https://www.apple.com/ca/safari/).

Officially, the following browsers and corresponding configurations are supported:

- Chrome: Versions from the last 0.5 years
- Edge: Versions from the last 0.5 years
- Opera: Versions from the last 0.5 years
- Firefox: Versions from the last 0.5 years, including Firefox ESR
- Safari: Versions from the last 1 year

If you encounter an issue specific to a browser, check that your browser is up to date, then check issues labeled with [firefox](https://github.com/deephaven/web-client-ui/labels/firefox) or [safari](https://github.com/deephaven/web-client-ui/labels/safari) for a list of known browser compatibility issues before reporting the issue.
