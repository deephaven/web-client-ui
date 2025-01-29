# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

### Bug Fixes

- Markdown incorrectly rendering inline code blocks ([#2342](https://github.com/deephaven/web-client-ui/issues/2342)) ([f85c76f](https://github.com/deephaven/web-client-ui/commit/f85c76f97fffda5c94a3b3a6f8acc39c4d5bce20)), closes [#2312](https://github.com/deephaven/web-client-ui/issues/2312)

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

### Bug Fixes

- Table plugins - pass through deprecated props ([#2308](https://github.com/deephaven/web-client-ui/issues/2308)) ([d884bff](https://github.com/deephaven/web-client-ui/commit/d884bffe5942af0baa0224a688661e5ea8917ea5)), closes [#2274](https://github.com/deephaven/web-client-ui/issues/2274)

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

### Features

- Ruff updates for DHE support ([#2280](https://github.com/deephaven/web-client-ui/issues/2280)) ([a35625e](https://github.com/deephaven/web-client-ui/commit/a35625efe3b918cd75d1dc07b02946398e2bca19))

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### Bug Fixes

- add gap between type and name in widget panel tooltip ([#2258](https://github.com/deephaven/web-client-ui/issues/2258)) ([4e8ad58](https://github.com/deephaven/web-client-ui/commit/4e8ad58c0ae5c162e8aca360cc009f9deafe3a29)), closes [#2254](https://github.com/deephaven/web-client-ui/issues/2254)

## [0.96.1](https://github.com/deephaven/web-client-ui/compare/v0.96.0...v0.96.1) (2024-10-11)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- Reuse dashboard tabs when reassigning the variable ([#2243](https://github.com/deephaven/web-client-ui/issues/2243)) ([d2c6eab](https://github.com/deephaven/web-client-ui/commit/d2c6eabb1fe313708fadd6676858466710159fda)), closes [#1971](https://github.com/deephaven/web-client-ui/issues/1971)

## [0.95.0](https://github.com/deephaven/web-client-ui/compare/v0.94.0...v0.95.0) (2024-09-20)

### ⚠ BREAKING CHANGES

- eslint rule will require type only imports where
  possible

### Bug Fixes

- Widget panel fixes ([#2227](https://github.com/deephaven/web-client-ui/issues/2227)) ([c985e12](https://github.com/deephaven/web-client-ui/commit/c985e1274097860dcbf4690ac8412c9f84831209))

### Code Refactoring

- Added consistent-type-imports eslint rule and ran --fix ([#2230](https://github.com/deephaven/web-client-ui/issues/2230)) ([2744f97](https://github.com/deephaven/web-client-ui/commit/2744f9793aeac2b70e475a725447dcba1b5f294c)), closes [#2229](https://github.com/deephaven/web-client-ui/issues/2229)

## [0.94.0](https://github.com/deephaven/web-client-ui/compare/v0.93.0...v0.94.0) (2024-09-18)

### ⚠ BREAKING CHANGES

- TestUtils has been moved to new package
  `@deephaven-test-utils`. Consumers will need to install the new package
  as a dev dependency and update references.

### Features

- Pass through additional actions from WidgetPanel ([#2224](https://github.com/deephaven/web-client-ui/issues/2224)) ([bc720d1](https://github.com/deephaven/web-client-ui/commit/bc720d1789a5e28c99b06d496e58187fb4b26038))

### Code Refactoring

- Split out @deephaven/test-utils package ([#2225](https://github.com/deephaven/web-client-ui/issues/2225)) ([1d027d3](https://github.com/deephaven/web-client-ui/commit/1d027d3f6c0b47910cc0b8285c471e90c5f113a8)), closes [#2185](https://github.com/deephaven/web-client-ui/issues/2185)

## [0.93.0](https://github.com/deephaven/web-client-ui/compare/v0.92.0...v0.93.0) (2024-09-12)

### Bug Fixes

- ChartBuilderPlugin fixes for charts built from PPQs in Enterprise ([#2167](https://github.com/deephaven/web-client-ui/issues/2167)) ([99b8d59](https://github.com/deephaven/web-client-ui/commit/99b8d5952ba325bf74d2d16ed39eb7a2e897d196))
- Publish WidgetPanelProps ([#2210](https://github.com/deephaven/web-client-ui/issues/2210)) ([7331976](https://github.com/deephaven/web-client-ui/commit/7331976004ed9b33fca9d97919d359dd881e8d0a)), closes [/github.com/deephaven-ent/iris/pull/2114/files#diff-536d6ac232028a4ebbafc5ca79bb1a22844488a4b628196e43056379f9326a90R17](https://github.com/deephaven//github.com/deephaven-ent/iris/pull/2114/files/issues/diff-536d6ac232028a4ebbafc5ca79bb1a22844488a4b628196e43056379f9326a90R17)

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Bug Fixes

- DH-17292 Handle disconnect from GridWidgetPlugin ([#2086](https://github.com/deephaven/web-client-ui/issues/2086)) ([0a924cd](https://github.com/deephaven/web-client-ui/commit/0a924cd5fe13e16642c50a59842c361bfff3788e))

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

### ⚠ BREAKING CHANGES

- Delete unused event types: `openPQObject`,
  `openControl`, `reload`, `clearAllFilters`.

### Bug Fixes

- TablePlugin needs to know table name and selected range ([#2181](https://github.com/deephaven/web-client-ui/issues/2181)) ([0b37477](https://github.com/deephaven/web-client-ui/commit/0b3747782958dc8e432fabda89ac0bce25ac9c22)), closes [#2093](https://github.com/deephaven/web-client-ui/issues/2093)

### Code Refactoring

- Change TabEvent to object literal, add TabEventMap ([#2191](https://github.com/deephaven/web-client-ui/issues/2191)) ([419f95d](https://github.com/deephaven/web-client-ui/commit/419f95d05c5db52e7b068398d6d2520b77c6aad3))

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

### Features

- Refactor console objects menu ([#2013](https://github.com/deephaven/web-client-ui/issues/2013)) ([8251180](https://github.com/deephaven/web-client-ui/commit/825118048326d3622aec2e4b851d81e8b7d93e35)), closes [#1884](https://github.com/deephaven/web-client-ui/issues/1884)

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Features

- Allow ref callback for Chart and ChartPanel ([#2174](https://github.com/deephaven/web-client-ui/issues/2174)) ([56d1fa9](https://github.com/deephaven/web-client-ui/commit/56d1fa9ba00d319794d686365be245c757ad2178))

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.86.1](https://github.com/deephaven/web-client-ui/compare/v0.86.0...v0.86.1) (2024-07-18)

### Bug Fixes

- add back panel prop to IrisGrid Plugin ([#2155](https://github.com/deephaven/web-client-ui/issues/2155)) ([6362eb7](https://github.com/deephaven/web-client-ui/commit/6362eb7b5292209abd9d473792cf3ecb55ade452)), closes [#2093](https://github.com/deephaven/web-client-ui/issues/2093)

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

### Features

- Core plugins refactor, XComponent framework ([#2150](https://github.com/deephaven/web-client-ui/issues/2150)) ([2571fad](https://github.com/deephaven/web-client-ui/commit/2571faddee86d3c93e7814eb9034e606578ac040))

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.83.0](https://github.com/deephaven/web-client-ui/compare/v0.82.0...v0.83.0) (2024-06-25)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

### Bug Fixes

- CSV Drag and Drop Console Error ([#2052](https://github.com/deephaven/web-client-ui/issues/2052)) ([85811dd](https://github.com/deephaven/web-client-ui/commit/85811dd64f1cb04fedc85d1f674ec90a2ea1556c))

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))
- Unedited markdown widgets not persisting ([#2019](https://github.com/deephaven/web-client-ui/issues/2019)) ([c17f136](https://github.com/deephaven/web-client-ui/commit/c17f1367e3575f634b93f29ff3623b99db3c1f0d))

### Features

- e2e combined improvements ([#1998](https://github.com/deephaven/web-client-ui/issues/1998)) ([99fc2f6](https://github.com/deephaven/web-client-ui/commit/99fc2f69758aa8b0289507b50c1ec52be0934d29))
- Replaced `RadioGroup` with Spectrum's ([#2020](https://github.com/deephaven/web-client-ui/issues/2020)) ([#2021](https://github.com/deephaven/web-client-ui/issues/2021)) ([c9ac72d](https://github.com/deephaven/web-client-ui/commit/c9ac72daddc4bc63012a675aa801af8ee807eff6))

### BREAKING CHANGES

- `RadioGroup` has been replaced by Spectrum
  `RadioGroup`. `RadioItem` has been replaced by Spectrum `Radio`
- Removed ButtonOld component, use Button instead.

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

### Bug Fixes

- Improve the look of the error view ([#2001](https://github.com/deephaven/web-client-ui/issues/2001)) ([3236c9b](https://github.com/deephaven/web-client-ui/commit/3236c9b7acb53e9468f09c1e57a99d79bb953774))

### Features

- Make grid widget respect global formatter settings ([#1995](https://github.com/deephaven/web-client-ui/issues/1995)) ([d1fba8f](https://github.com/deephaven/web-client-ui/commit/d1fba8f664e1b33e492ddd9fe68d50545a08a3f9))

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

### Performance Improvements

- remove focus tracking in notebook panel causing extra re-render ([#1983](https://github.com/deephaven/web-client-ui/issues/1983)) ([a283e13](https://github.com/deephaven/web-client-ui/commit/a283e13fafe1ecb156985fab00ba15344f180ff4))
- remove workspace dependancy from iris-grid-panel and memoize settings redux selector ([#1982](https://github.com/deephaven/web-client-ui/issues/1982)) ([c3ea867](https://github.com/deephaven/web-client-ui/commit/c3ea86709f0a184065dd346d71d6525ed881e465)), closes [#1977](https://github.com/deephaven/web-client-ui/issues/1977)

### BREAKING CHANGES

- getPluginContent deprecatedProps have been removed from
  iris-grid

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

### Performance Improvements

- Use `fast-deep-equal` instead of `deep-equal ([#1979](https://github.com/deephaven/web-client-ui/issues/1979)) ([3f3de9f](https://github.com/deephaven/web-client-ui/commit/3f3de9fd6a150f59cf6bf8e08eb1c11f0d9d93e1))

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Features

- context menu reopen for stack only ([#1932](https://github.com/deephaven/web-client-ui/issues/1932)) ([6a9a6a4](https://github.com/deephaven/web-client-ui/commit/6a9a6a4d4f09fd0723456b45a3dab1603e181f7c)), closes [#1931](https://github.com/deephaven/web-client-ui/issues/1931)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Bug Fixes

- Fixed svg url ([#1839](https://github.com/deephaven/web-client-ui/issues/1839)) ([63fe035](https://github.com/deephaven/web-client-ui/commit/63fe0354df2df40e318aa1738ff2bb916c0aea8e)), closes [#1838](https://github.com/deephaven/web-client-ui/issues/1838)

### Features

- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Bug Fixes

- inline blocks throw error in md notebook ([#1820](https://github.com/deephaven/web-client-ui/issues/1820)) ([f871323](https://github.com/deephaven/web-client-ui/commit/f871323a069a160cae69e1f5722464bb5be604b5)), closes [#1817](https://github.com/deephaven/web-client-ui/issues/1817)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

### Features

- add LaTeX to Markdown ([#1734](https://github.com/deephaven/web-client-ui/issues/1734)) ([434930a](https://github.com/deephaven/web-client-ui/commit/434930af3e30fceab4e4dc193f29016522799cb1)), closes [#1720](https://github.com/deephaven/web-client-ui/issues/1720)
- Chart responsible for its own theme ([#1772](https://github.com/deephaven/web-client-ui/issues/1772)) ([fabb055](https://github.com/deephaven/web-client-ui/commit/fabb055f9dacdbb4ad1b4ce7ca85d170f955366d)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)

### BREAKING CHANGES

- - Renamed `ColorUtils.getColorwayFromTheme` to `normalizeColorway`

* Removed `chartTheme` arg from functions in `ChartUtils`,
  `ChartModelFactory` and `FigureChartModel` in @deephaven/chart

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))

### BREAKING CHANGES

- linker and iris grid custom cursor styling and assets
  are now provided by components directly. DHE css and svg files
  containing linker cursors should be removed/de-duplicated.

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

### Features

- Add ObjectFetcher context and useObjectFetcher hook ([#1753](https://github.com/deephaven/web-client-ui/issues/1753)) ([2cd46ce](https://github.com/deephaven/web-client-ui/commit/2cd46ce2d5107553d3f91933294638a5fb183245))

### BREAKING CHANGES

- - `useConnection` is moved from `jsapi-components` package to
    `app-utils` package

* Should only be used at the app level, as there could be multiple
  connections
* `WidgetDefinition` has been renamed to `WidgetDescriptor`

## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

### Bug Fixes

- Made some plugin types generic ([#1769](https://github.com/deephaven/web-client-ui/issues/1769)) ([ac40c6f](https://github.com/deephaven/web-client-ui/commit/ac40c6f4c0e75c34689c964c2614017d50e74d74)), closes [#1759](https://github.com/deephaven/web-client-ui/issues/1759)

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Bug Fixes

- Made WidgetComponentProps generic ([#1760](https://github.com/deephaven/web-client-ui/issues/1760)) ([8cb0a10](https://github.com/deephaven/web-client-ui/commit/8cb0a10f796978fdf364c5f046ac60bf32eae6f5)), closes [#1759](https://github.com/deephaven/web-client-ui/issues/1759)

### Features

- allow themes to use any srgb color for definitions ([#1756](https://github.com/deephaven/web-client-ui/issues/1756)) ([b047fa3](https://github.com/deephaven/web-client-ui/commit/b047fa36de3a285be925736ef73722a60d1d9ed7))

### BREAKING CHANGES

- - IrisGridThemeContext no longer accepts a paritial theme. By
    guaranteeing the provider is a full theme we can resolve the CSS
    variables and normailze the colors only once per theme load globally,
    rather than having to do it once per grid.

* Themes must be defined using valid srgb CSS colors, and not hsl raw
  component values

# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

### Bug Fixes

- Handle undefined DashboardData props ([#1726](https://github.com/deephaven/web-client-ui/issues/1726)) ([45fa929](https://github.com/deephaven/web-client-ui/commit/45fa929586c0b13a738eceaa064b261eecbd8308)), closes [#1684](https://github.com/deephaven/web-client-ui/issues/1684) [#1685](https://github.com/deephaven/web-client-ui/issues/1685)
- loading spinner finishes before all series load ([#1729](https://github.com/deephaven/web-client-ui/issues/1729)) ([e79297b](https://github.com/deephaven/web-client-ui/commit/e79297b213dbf3e615bae9024323efb45c29cda3)), closes [#1654](https://github.com/deephaven/web-client-ui/issues/1654)

### Features

- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Features

- theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Features

- Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Features

- Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
- Tables that have names starting with underscore do not auto-launch from console ([#1656](https://github.com/deephaven/web-client-ui/issues/1656)) ([21131fe](https://github.com/deephaven/web-client-ui/commit/21131fe3cb508d8e6fb057d3bae993ca3dd1a23b)), closes [#1549](https://github.com/deephaven/web-client-ui/issues/1549) [#1410](https://github.com/deephaven/web-client-ui/issues/1410)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.
- Tables assigned to variable beginning with "\_" will not
  open automatically even if "Auto Launch Panels" is checked.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

### Bug Fixes

- Changes for Deephaven UI embedding widget plugins ([#1644](https://github.com/deephaven/web-client-ui/issues/1644)) ([b6eeb30](https://github.com/deephaven/web-client-ui/commit/b6eeb309e8e55522d99c1528958bd0c7674e2d0f))

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Bug Fixes

- Panels not reinitializing if makeModel changes ([#1633](https://github.com/deephaven/web-client-ui/issues/1633)) ([5ee98cd](https://github.com/deephaven/web-client-ui/commit/5ee98cd8121a90535536ac6c429bbd0ba2c1a2f3))

### Features

- Add ResizeObserver to Grid and Chart ([#1626](https://github.com/deephaven/web-client-ui/issues/1626)) ([35311c8](https://github.com/deephaven/web-client-ui/commit/35311c832040b29e362c28f80983b4664c9aa1d5))
- Read settings from props/server config when available ([#1558](https://github.com/deephaven/web-client-ui/issues/1558)) ([52ba2cd](https://github.com/deephaven/web-client-ui/commit/52ba2cd125ff68f71c479d2d7c82f4b08d5b2ab6))
- Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### BREAKING CHANGES

- - ChartThemeProvider is now required to provide ChartTheme

* ChartModelFactory and ChartUtils now require chartTheme args

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Bug Fixes

- Panel focus throwing an exception ([#1609](https://github.com/deephaven/web-client-ui/issues/1609)) ([9e8b7ae](https://github.com/deephaven/web-client-ui/commit/9e8b7aef65cbae5aa453b33a66dfbdb5a17b1298))
- Plugins were re-registering on every re-render ([#1613](https://github.com/deephaven/web-client-ui/issues/1613)) ([5977389](https://github.com/deephaven/web-client-ui/commit/59773893644431daae23761ea02e6ccc8f44c413))

### Features

- Add support for multi-partition parquet:kv tables ([#1580](https://github.com/deephaven/web-client-ui/issues/1580)) ([d92c91e](https://github.com/deephaven/web-client-ui/commit/d92c91e8b47f412e333a92e4e6649557eea99707)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143) [#1438](https://github.com/deephaven/web-client-ui/issues/1438)
- Convert DashboardPlugins to WidgetPlugins ([#1598](https://github.com/deephaven/web-client-ui/issues/1598)) ([a260842](https://github.com/deephaven/web-client-ui/commit/a2608428075728a5a5edf770975eed0e11a428ff)), closes [#1573](https://github.com/deephaven/web-client-ui/issues/1573)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- Remove @deephaven/app-utils from @deephaven/dashboard-core-plugins dependency list ([#1596](https://github.com/deephaven/web-client-ui/issues/1596)) ([7b59763](https://github.com/deephaven/web-client-ui/commit/7b59763d528a95eaca32e4c9607c50d447215798)), closes [#1593](https://github.com/deephaven/web-client-ui/issues/1593)

### Features

- Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)

### BREAKING CHANGES

- - `usePlugins` and `PluginsContext` were moved from
    `@deephaven/app-utils` to `@deephaven/plugin`.

* `useLoadTablePlugin` was moved from `@deephaven/app-utils` to
  `@deephaven/dashboard-core-plugins`.
* `useConnection` and `ConnectionContext` were moved from
  `@deephaven/app-utils` to `@deephaven/jsapi-components`.
* `DeephavenPluginModuleMap` was removed from `@deephaven/redux`. Use
  `PluginModuleMap` from `@deephaven/plugin` instead.

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

### Bug Fixes

- Handle deletion of unsaved copied file in NotebookPanel ([#1557](https://github.com/deephaven/web-client-ui/issues/1557)) ([4021aac](https://github.com/deephaven/web-client-ui/commit/4021aac3bc130f8eec84385c9aadcb4ecf0b995c)), closes [#1359](https://github.com/deephaven/web-client-ui/issues/1359)
- Prompt for resetting layout ([#1552](https://github.com/deephaven/web-client-ui/issues/1552)) ([a273e64](https://github.com/deephaven/web-client-ui/commit/a273e6433a81f5500fb39992cac276bcbdbda753)), closes [#1250](https://github.com/deephaven/web-client-ui/issues/1250)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- Add copy/rename/delete options to notebook overflow menu ([#1551](https://github.com/deephaven/web-client-ui/issues/1551)) ([4441109](https://github.com/deephaven/web-client-ui/commit/4441109d10dcee8a9415b6884114ee5083fd1cc0)), closes [#1359](https://github.com/deephaven/web-client-ui/issues/1359)

### BREAKING CHANGES

- Inline LoadingSpinner instances will need to be
  decorated with `className="loading-spinner-vertical-align"` for vertical
  alignment to work as before

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

### Features

- Expose containerRef from ChartPanel ([#1500](https://github.com/deephaven/web-client-ui/issues/1500)) ([848fef4](https://github.com/deephaven/web-client-ui/commit/848fef4fe653193a2b49c4a45ccffe29349a821d))

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Bug Fixes

- Remove totals table rows from displayed row count ([#1492](https://github.com/deephaven/web-client-ui/issues/1492)) ([f686891](https://github.com/deephaven/web-client-ui/commit/f68689121c7df098dbf86fa76bf2ccf8dbda6566)), closes [#1407](https://github.com/deephaven/web-client-ui/issues/1407)

### Features

- adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)
- Consolidate and normalize plugin types ([#1456](https://github.com/deephaven/web-client-ui/issues/1456)) ([43a782d](https://github.com/deephaven/web-client-ui/commit/43a782dd3ebf582b18e155fdbc313176b0bf0f84)), closes [#1454](https://github.com/deephaven/web-client-ui/issues/1454) [#1451](https://github.com/deephaven/web-client-ui/issues/1451)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.45.1](https://github.com/deephaven/web-client-ui/compare/v0.45.0...v0.45.1) (2023-08-01)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.44.1](https://github.com/deephaven/web-client-ui/compare/v0.44.0...v0.44.1) (2023-07-11)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Bug Fixes

- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Bug Fixes

- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Bug Fixes

- DH-15032: Fix incorrect warning about updated shared state ([#1364](https://github.com/deephaven/web-client-ui/issues/1364)) ([9e53dd2](https://github.com/deephaven/web-client-ui/commit/9e53dd2796b84963bd90e7043122a6b2c4d3cf46))

### Features

- add column count to table tooltip ([#1382](https://github.com/deephaven/web-client-ui/issues/1382)) ([004ac6c](https://github.com/deephaven/web-client-ui/commit/004ac6cc1bd7772477b8e922075a344a4f8e71d3))

## [0.41.1](https://github.com/deephaven/web-client-ui/compare/v0.41.0...v0.41.1) (2023-06-08)

### Bug Fixes

- Cannot add control from Controls menu with click ([#1363](https://github.com/deephaven/web-client-ui/issues/1363)) ([65c0925](https://github.com/deephaven/web-client-ui/commit/65c09253608f7c8c887ca4e70cc5632e81673301)), closes [#1362](https://github.com/deephaven/web-client-ui/issues/1362)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

### Bug Fixes

- notebook panel unsaved indicator not showing after dragging a panel ([#1325](https://github.com/deephaven/web-client-ui/issues/1325)) ([99818a8](https://github.com/deephaven/web-client-ui/commit/99818a8ee4b505da7708914105a4197abdc502d8))

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- De-globalize JSAPI in Chart package ([#1258](https://github.com/deephaven/web-client-ui/issues/1258)) ([87fa2ef](https://github.com/deephaven/web-client-ui/commit/87fa2ef76e0482a1d641d8fea2d33fdad2996ef5))
- De-globalize JSAPI in Console package ([#1292](https://github.com/deephaven/web-client-ui/issues/1292)) ([3f12dd3](https://github.com/deephaven/web-client-ui/commit/3f12dd38a4db172697b3a7b39e6fbbd83d9f8519))
- De-globalize JSAPI in IrisGrid package ([#1262](https://github.com/deephaven/web-client-ui/issues/1262)) ([588cb8f](https://github.com/deephaven/web-client-ui/commit/588cb8fd080ac992da40e9b732d82e206032c9eb))
- De-globalize utils, formatters, linker ([#1278](https://github.com/deephaven/web-client-ui/issues/1278)) ([cb0e9ba](https://github.com/deephaven/web-client-ui/commit/cb0e9ba432a096cdb61c76787cff66c09a337372))
- Update @vscode/codicons to v0.0.33 ([#1259](https://github.com/deephaven/web-client-ui/issues/1259)) ([1b29af1](https://github.com/deephaven/web-client-ui/commit/1b29af18fa60411a0e16ca1df27a969b11492c56))

### BREAKING CHANGES

- - Components `IrisGrid`, `Chart`, `ChartBuilder`,
    `AdvancedFilterCreator`, `GotoRow`, `IrisGridModelUpdater`,
    `TableCSVExporter` get the JSAPI reference from the `model` prop. `dh`
    prop removed.

* `makeApi` props in `IrisGridPanel` and `ChartPanel` removed.
* Components `Console`, `ConsoleMenu`, `ConsoleStatusBar` now require
  the JSAPI instance in the `dh` prop.
* `ConsoleUtils`: static methods `isTableType`, `isWidgetType`,
  `isOpenableType`, `isFigureType`, `isPandas` require JSAPI instance
  passed in the first argument.
* `SessionUtils`: static methods `createSessionWrapper`,
  `loadSessionWrapper` require JSAPI instance passed in the first
  argument.
* Class `IrisGridModel` requires JSAPI instance passed in the
  constructor args.
* Components `DashboardLayout`, `ObjectIcon` has to be wrapped in
  `ApiContext.Provider` passing the JSAPI instance.

- - Class `Formatter` requires the JSAPI instance as the first argument.

* Classes `DateTimeColumnFormatter`, `DecimalColumnFormatter`,
  `IntegerColumnFormatter`, `TableColumnFormatter`: static method
  `isValid` and constructor require the JSAPI instance in the first
  argument.
* Component `Chart` requires the JSAPI instance passed in the new prop
  `dh`.
* `WidgetUtils`: methods `createChartModel`, `createGridModel` methods
  require the JSAPI instance passed in the first argument.
* Components `DateTimeOptions`, `TableInput`, `useViewportData` have to
  be wrapped in `ApiContext.Provider` passing the JSAPI instance.
* `SettingsUtils`: methods `isValidFormat` and
  `isFormatRuleValidForSave` require the JSAPI instance passed in the
  first argument.
* `SessionUtils`: methods `createConnection`, `createCoreClient` require
  the JSAPI instance passed in the first argument.
* `TableUtils` static methods `applyCustomColumns`, `applyFilter`,
  `applyNeverFilter`, `applySort` converted to instance methods.
* Components `DropdownFilterPanel`, `Linker` now get the JSAPI instance
  from redux store.
* `DecimalFormatContextMenu.getOptions`,
  `IntegerFormatContextMenu.getOptions` now require the JSAPI instance in
  the first argument.

- - `DateUtils` static methods `makeDateWrapper`, `getNextDate `,
    `parseDateRange` now require the JSAPI object as the first argument.

* `IrisGridUtils` static methods `dehydrateIrisGridState`,
  `hydrateIrisGridState`, `hydrateQuickFilters`,
  `dehydrateAdvancedFilters`, `hydrateAdvancedFilters`,
  `dehydrateAdvancedFilterOptions`, `hydrateAdvancedFilterOptions`,
  `dehydratePendingDataMap`, `hydratePendingDataMap`, `dehydrateValue`,
  `hydrateValue`, `dehydrateDateTime`, `hydrateDateTime`, `hydrateLong`,
  `hydrateSort`, `applyTableSettings`, `getFiltersFromInputFilters`,
  `rangeSetFromRanges` converted to instance methods. Consumers now need
  to create an `IrisGridUtils` instance and pass the JSAPI object to the
  constructor.
* `TableUtils` static methods `makeQuickFilter`,
  `makeQuickFilterFromComponent`, `makeQuickNumberFilter`,
  `makeQuickTextFilter`, `makeQuickBooleanFilter`, `makeQuickDateFilter`,
  `makeQuickDateFilterWithOperation`, `makeQuickCharFilter`,
  `makeAdvancedFilter`, `makeAdvancedValueFilter`, `makeFilterValue`,
  `makeFilterRawValue`, `makeValue`, `makeSelectValueFilter` converted to
  instance methods. Consumers now need to create a `TableUtils` instance
  and pass the JSAPI object to the constructor.
* `IrisGridTableModel`, `IrisGridTableModelTemplate`,
  `IrisGridProxyModel` constructors require the JSAPI object in the first
  argument.
* `IrisGridTestUtils.makeModel`, `IrisGridModelFactory.makeModel` now
  require the JSAPI object in the first argument.
* `IrisGridContextMenuHandler` constructor requires the JSAPI object in
  the second argument.
* `IrisGridPanel` requires a new `makeApi` prop, a function that
  resolves with the JSAPI instance.
* `CrossColumnSearch.createSearchFilter` requires the JSAPI object
  argument.
* Components `AdvancedFilterCreatorSelectValue`,
  `AdvancedFilterCreatorSelectValueList`, `ChartBuilder`, `GotoRow`,
  `IrisGrid`, `IrisGridModelUpdater`, `IrisGridPartitionSelector`,
  `PartitionSelectorSearch`, `TableCSVExporter`, `TableSaver`,
  `TreeTableViewportUpdater`, `RowFormatEditor`, `ColumnFormatEditor`,
  `ConditionEditor` now require the JSAPI object passed in the new prop
  `dh`.
* Components `AdvancedFilterCreator`, `AdvancedFilterCreatorFilterItem`
  require the `TableUtils` instance pass in the new prop `tableUtils`.
* `ConditionalFormattingUtils` static methods `getFormatColumns`,
  `isDateConditionValid` require the JSAPI object in the first argument.
* `ConditionalFormattingAPIUtils` static method `makeRowFormatColumn`
  requires the JSAPI object in the first argument.

- - `ChartUtils` class now needs to be instantiated with a JSAPI object,
    most of the methods converted from static to instance methods.

* All `ChartModelFactory` methods require JSAPI object as the first
  argument.
* `FigureChartModel` constructor requires JSAPI object as the first
  argument.

- `vsCircleLargeOutline` icon renamed to `vsCircleLarge`

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.3](https://github.com/deephaven/web-client-ui/compare/v0.37.2...v0.37.3) (2023-04-25)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Bug Fixes

- Fix OneClick links not filtering plots ([#1217](https://github.com/deephaven/web-client-ui/issues/1217)) ([9b20f9e](https://github.com/deephaven/web-client-ui/commit/9b20f9e8f3912959e32ae8d8d597ee584357ad70)), closes [#1198](https://github.com/deephaven/web-client-ui/issues/1198)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

### Features

- Display workerName and processInfoId in the console status bar ([#1173](https://github.com/deephaven/web-client-ui/issues/1173)) ([85ce600](https://github.com/deephaven/web-client-ui/commit/85ce600ad63cd49504f75db5663ed64ec095749e))

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Bug Fixes

- Double clicking a file causes the loader to flash incorrectly ([#1189](https://github.com/deephaven/web-client-ui/issues/1189)) ([a279670](https://github.com/deephaven/web-client-ui/commit/a279670e536e382e1df17dcb5337f1164c82a3ff)), closes [#942](https://github.com/deephaven/web-client-ui/issues/942)
- Save or discard a changed notebook does not close modal on first click ([#1188](https://github.com/deephaven/web-client-ui/issues/1188)) ([bba2d01](https://github.com/deephaven/web-client-ui/commit/bba2d01df0c541ca8cfe89753098ff42919036ab)), closes [#1187](https://github.com/deephaven/web-client-ui/issues/1187)

### Features

- Double click notebook tab to remove its preview status ([#1190](https://github.com/deephaven/web-client-ui/issues/1190)) ([4870171](https://github.com/deephaven/web-client-ui/commit/4870171defd2f361295105489c87a41b2c8d1f3a)), closes [#1189](https://github.com/deephaven/web-client-ui/issues/1189)
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Code Refactoring

- Fix fast refresh invalidations ([#1150](https://github.com/deephaven/web-client-ui/issues/1150)) ([2606826](https://github.com/deephaven/web-client-ui/commit/26068267c2cd67bc971b9537f8ce4108372167f5)), closes [#727](https://github.com/deephaven/web-client-ui/issues/727)
- TypeScript Type Improvements ([#1056](https://github.com/deephaven/web-client-ui/issues/1056)) ([0be0850](https://github.com/deephaven/web-client-ui/commit/0be0850a25e422150c61fbb7a6eff94614546f90)), closes [#1122](https://github.com/deephaven/web-client-ui/issues/1122)

### BREAKING CHANGES

- Renamed `renderFileListItem` to `FileListItem`.
  Renamed `RenderFileListItemProps` to `FileListItemProps`.
  Removed exports for `ConsolePlugin.assertIsConsolePluginProps`,
  `GridPlugin.SUPPORTED_TYPES`, `FileList.getPathFromItem`,
  `FileList.DRAG_HOVER_TIMEOUT`, `FileList.getItemIcon`,
  `Grid.directionForKey`, `GotoRow.isIrisGridProxyModel`, and
  `Aggregations.SELECTABLE_OPTIONS`. These were all only being consumed
  within their own file and are not consumed in enterprise
- Selector Type removed from redux

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

### Code Refactoring

- Replace usage of Column.index with column name ([#1126](https://github.com/deephaven/web-client-ui/issues/1126)) ([7448a88](https://github.com/deephaven/web-client-ui/commit/7448a88a651f82416de9c2aa0ebbbb217a6eae5c)), closes [#965](https://github.com/deephaven/web-client-ui/issues/965)

### BREAKING CHANGES

- Removed index property from dh.types Column type.
  IrisGridUtils.dehydrateSort now returns column name instead of index.
  TableUtils now expects column name instead of index for functions that
  don't have access to a columns array.

## [0.31.1](https://github.com/deephaven/web-client-ui/compare/v0.31.0...v0.31.1) (2023-03-03)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

## [0.29.1](https://github.com/deephaven/web-client-ui/compare/v0.29.0...v0.29.1) (2023-02-10)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/dashboard-core-plugins
