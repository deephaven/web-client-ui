# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)


### Features

* Add ObjectFetcher context and useObjectFetcher hook ([#1753](https://github.com/deephaven/web-client-ui/issues/1753)) ([2cd46ce](https://github.com/deephaven/web-client-ui/commit/2cd46ce2d5107553d3f91933294638a5fb183245))


### BREAKING CHANGES

* - `useConnection` is moved from `jsapi-components` package to
`app-utils` package
- Should only be used at the app level, as there could be multiple
connections
- `WidgetDefinition` has been renamed to `WidgetDescriptor`





# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)


### Features

* Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)





# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)


### Bug Fixes

* Log figure errors, don't show infinite spinner ([#1614](https://github.com/deephaven/web-client-ui/issues/1614)) ([75783d0](https://github.com/deephaven/web-client-ui/commit/75783d0ed96e9e28214ca8681a73f23b1dc78085))


### Features

* Add `LayoutManagerContext` and `useLayoutManager` ([#1625](https://github.com/deephaven/web-client-ui/issues/1625)) ([0a6965a](https://github.com/deephaven/web-client-ui/commit/0a6965a41953470cb032ef44d93497fa438783e4))





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Features

* web-client-ui changes required for deephaven.ui ([#1567](https://github.com/deephaven/web-client-ui/issues/1567)) ([94ab25c](https://github.com/deephaven/web-client-ui/commit/94ab25cb16593f175ef4669a6845cdc22b847fc2))
* Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)





# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)


### Features

* data bar render from API ([#1415](https://github.com/deephaven/web-client-ui/issues/1415)) ([ee7d1c1](https://github.com/deephaven/web-client-ui/commit/ee7d1c108e86973b4c6855e482dce21d665dfe28)), closes [#0000](https://github.com/deephaven/web-client-ui/issues/0000) [#FF0000](https://github.com/deephaven/web-client-ui/issues/FF0000) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#00FF00](https://github.com/deephaven/web-client-ui/issues/00FF00)





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/jsapi-types





# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

### Features

- Added containsIgnoreCase to FilterValue interface ([#1426](https://github.com/deephaven/web-client-ui/issues/1426)) ([d131b05](https://github.com/deephaven/web-client-ui/commit/d131b051c6dece462a6691ca0013bb4fb0ba9a71)), closes [#1425](https://github.com/deephaven/web-client-ui/issues/1425)

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Features

- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Features

- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

**Note:** Version bump only for package @deephaven/jsapi-types

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

### Features

- Pass optional envoyPrefix query param to CoreClient constructor ([#1219](https://github.com/deephaven/web-client-ui/issues/1219)) ([8b1e58c](https://github.com/deephaven/web-client-ui/commit/8b1e58cf1cb4a1aab18405b87160b223f04ccd9d))

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/jsapi-types

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Features

- Add signatureHelp and hover providers to monaco ([#1178](https://github.com/deephaven/web-client-ui/issues/1178)) ([f1f3abf](https://github.com/deephaven/web-client-ui/commit/f1f3abffc9df4178477714f06dcc57d40d6942a9))
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Code Refactoring

- TypeScript Type Improvements ([#1056](https://github.com/deephaven/web-client-ui/issues/1056)) ([0be0850](https://github.com/deephaven/web-client-ui/commit/0be0850a25e422150c61fbb7a6eff94614546f90)), closes [#1122](https://github.com/deephaven/web-client-ui/issues/1122)

### BREAKING CHANGES

- Selector Type removed from redux

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

### Code Refactoring

- Replace usage of Column.index with column name ([#1126](https://github.com/deephaven/web-client-ui/issues/1126)) ([7448a88](https://github.com/deephaven/web-client-ui/commit/7448a88a651f82416de9c2aa0ebbbb217a6eae5c)), closes [#965](https://github.com/deephaven/web-client-ui/issues/965)

### BREAKING CHANGES

- Removed index property from dh.types Column type.
  IrisGridUtils.dehydrateSort now returns column name instead of index.
  TableUtils now expects column name instead of index for functions that
  don't have access to a columns array.

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/jsapi-types

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

### Bug Fixes

- Remove default export in jsapi-types ([#1092](https://github.com/deephaven/web-client-ui/issues/1092)) ([7de114a](https://github.com/deephaven/web-client-ui/commit/7de114a057abea48a436cdb3fdd40bc04d3156f5))

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

### Features

- Import JS API as a module ([#1084](https://github.com/deephaven/web-client-ui/issues/1084)) ([9aab657](https://github.com/deephaven/web-client-ui/commit/9aab657ca674e404db6d3cf9b9c663627d635c2c)), closes [#444](https://github.com/deephaven/web-client-ui/issues/444)

### BREAKING CHANGES

- The JS API packaged as a module is now required for the
  `code-studio`, `embed-grid`, and `embed-chart` applications. Existing
  (Enterprise) applications should be able to use `jsapi-shim` still and
  load the JS API using the old method.
