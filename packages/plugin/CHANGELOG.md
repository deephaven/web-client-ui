# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/plugin





# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/plugin





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)


### Features

* Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
* Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)


### Bug Fixes

* Changes for Deephaven UI embedding widget plugins ([#1644](https://github.com/deephaven/web-client-ui/issues/1644)) ([b6eeb30](https://github.com/deephaven/web-client-ui/commit/b6eeb309e8e55522d99c1528958bd0c7674e2d0f))





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)


### Features

* Add `LayoutManagerContext` and `useLayoutManager` ([#1625](https://github.com/deephaven/web-client-ui/issues/1625)) ([0a6965a](https://github.com/deephaven/web-client-ui/commit/0a6965a41953470cb032ef44d93497fa438783e4))





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/plugin





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/plugin





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Bug Fixes

* Remove @deephaven/app-utils from @deephaven/dashboard-core-plugins dependency list ([#1596](https://github.com/deephaven/web-client-ui/issues/1596)) ([7b59763](https://github.com/deephaven/web-client-ui/commit/7b59763d528a95eaca32e4c9607c50d447215798)), closes [#1593](https://github.com/deephaven/web-client-ui/issues/1593)


### Features

* Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)


### BREAKING CHANGES

* - `usePlugins` and `PluginsContext` were moved from
`@deephaven/app-utils` to `@deephaven/plugin`.
- `useLoadTablePlugin` was moved from `@deephaven/app-utils` to
`@deephaven/dashboard-core-plugins`.
- `useConnection` and `ConnectionContext` were moved from
`@deephaven/app-utils` to `@deephaven/jsapi-components`.
- `DeephavenPluginModuleMap` was removed from `@deephaven/redux`. Use
`PluginModuleMap` from `@deephaven/plugin` instead.





# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)


### Features

* Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)





## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

**Note:** Version bump only for package @deephaven/plugin





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)


### Bug Fixes

* Plugin peer dependencies do not get versions from lerna ([#1517](https://github.com/deephaven/web-client-ui/issues/1517)) ([322f6ff](https://github.com/deephaven/web-client-ui/commit/322f6ff7d2ef949774bab61527e5e1c32f344da6))





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/plugin





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)


### Features

* Consolidate and normalize plugin types ([#1456](https://github.com/deephaven/web-client-ui/issues/1456)) ([43a782d](https://github.com/deephaven/web-client-ui/commit/43a782dd3ebf582b18e155fdbc313176b0bf0f84)), closes [#1454](https://github.com/deephaven/web-client-ui/issues/1454) [#1451](https://github.com/deephaven/web-client-ui/issues/1451)
