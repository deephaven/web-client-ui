# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Bug Fixes

- AuthPluginParent wasn't working when embedded in an iframe ([#1383](https://github.com/deephaven/web-client-ui/issues/1383)) ([e23695d](https://github.com/deephaven/web-client-ui/commit/e23695d4baf232720ca89cb7d24e9a918f3fe913)), closes [#1373](https://github.com/deephaven/web-client-ui/issues/1373)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/app-utils

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/app-utils

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/app-utils

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

### Bug Fixes

- truncated column headers ([#1319](https://github.com/deephaven/web-client-ui/issues/1319)) ([db7716e](https://github.com/deephaven/web-client-ui/commit/db7716ebe953611ab4b4eec781e2e03204380ebd)), closes [#1318](https://github.com/deephaven/web-client-ui/issues/1318)
- Worker plugin definitions, optional panel wrapper for Dashboards ([#1329](https://github.com/deephaven/web-client-ui/issues/1329)) ([c32ffbc](https://github.com/deephaven/web-client-ui/commit/c32ffbcf66826c4e2da3ac82e5b5086524d05ec8))

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/app-utils

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/app-utils

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- De-globalize JSAPI in Console package ([#1292](https://github.com/deephaven/web-client-ui/issues/1292)) ([3f12dd3](https://github.com/deephaven/web-client-ui/commit/3f12dd38a4db172697b3a7b39e6fbbd83d9f8519))

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

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))
- Relative links ([#1204](https://github.com/deephaven/web-client-ui/issues/1204)) ([f440eb9](https://github.com/deephaven/web-client-ui/commit/f440eb9a19c437d2118ec2e6421e1ba4ebc4f56c)), closes [#1070](https://github.com/deephaven/web-client-ui/issues/1070) [#1070](https://github.com/deephaven/web-client-ui/issues/1070)

## [0.37.3](https://github.com/deephaven/web-client-ui/compare/v0.37.2...v0.37.3) (2023-04-25)

### Bug Fixes

- Move @deephaven/redux to be a dependency instead ([#1249](https://github.com/deephaven/web-client-ui/issues/1249)) ([3f24e11](https://github.com/deephaven/web-client-ui/commit/3f24e110ca08c5afa7e39d58d0171f2ce4999404))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/app-utils

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)
