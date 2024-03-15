# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/golden-layout





## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)


### Features

* always show close button on the active panel in a stack ([#1773](https://github.com/deephaven/web-client-ui/issues/1773)) ([33c6a8d](https://github.com/deephaven/web-client-ui/commit/33c6a8d39c17fb60d291ce4be9a77bbad16b4e65))





# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/golden-layout





## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)


### Features

* allow themes to use any srgb color for definitions ([#1756](https://github.com/deephaven/web-client-ui/issues/1756)) ([b047fa3](https://github.com/deephaven/web-client-ui/commit/b047fa36de3a285be925736ef73722a60d1d9ed7))


### BREAKING CHANGES

* - IrisGridThemeContext no longer accepts a paritial theme. By
guaranteeing the provider is a full theme we can resolve the CSS
variables and normailze the colors only once per theme load globally,
rather than having to do it once per grid.
- Themes must be defined using valid srgb CSS colors, and not hsl raw
component values





# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)


### Features

* NavTabList component ([#1698](https://github.com/deephaven/web-client-ui/issues/1698)) ([96641fb](https://github.com/deephaven/web-client-ui/commit/96641fbc2f5f5ee291da15e464e80183d5107a57))





# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)


### Features

* Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)





## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)


### Features

* Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
* Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))


### BREAKING CHANGES

* Bootstrap color variables are now predominantly hsl
based. SCSS will need to be updated accordingly. Theme providers are
needed to load themes.





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Features

* Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)





# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)


* fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)


### Features

* Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)
* Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)


### BREAKING CHANGES

* Theme variables have to be present on body to avoid
Monaco init failing
* Inline LoadingSpinner instances will need to be
decorated with `className="loading-spinner-vertical-align"` for vertical
alignment to work as before





## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)


### Bug Fixes

* Dehydration of class components ([#1535](https://github.com/deephaven/web-client-ui/issues/1535)) ([3e834de](https://github.com/deephaven/web-client-ui/commit/3e834de31a5ba8df8041637ece4aacfa7fbcd794)), closes [#1534](https://github.com/deephaven/web-client-ui/issues/1534)





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

**Note:** Version bump only for package @deephaven/golden-layout





## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)


### Bug Fixes

* Remove unused ref forwarded to all dashboard panels ([#1451](https://github.com/deephaven/web-client-ui/issues/1451)) ([938aa07](https://github.com/deephaven/web-client-ui/commit/938aa0724abb58b09d8ce1d339766b1072c95202))





# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/golden-layout





# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

### Bug Fixes

- Catch errors when emitting events to prevent breaking entire layout ([#1353](https://github.com/deephaven/web-client-ui/issues/1353)) ([aac5bd2](https://github.com/deephaven/web-client-ui/commit/aac5bd2ad4aeb88ac1fb18236f7bfb983ae35cf0)), closes [#1352](https://github.com/deephaven/web-client-ui/issues/1352)

### Features

- Improve golden layout tab overflow drop down behaviour ([#1330](https://github.com/deephaven/web-client-ui/issues/1330)) ([9331822](https://github.com/deephaven/web-client-ui/commit/933182277eb4226caa45871d651789a70fc573d3))

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/golden-layout

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

### Reverts

- "refactor: Clean up golden-layout css ([#1322](https://github.com/deephaven/web-client-ui/issues/1322))" ([#1334](https://github.com/deephaven/web-client-ui/issues/1334)) ([2f7928a](https://github.com/deephaven/web-client-ui/commit/2f7928a67e14f2026aef73cee542045ce7477351))

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Features

- Mount layout panels inside the main react tree ([#1229](https://github.com/deephaven/web-client-ui/issues/1229)) ([f8f8d61](https://github.com/deephaven/web-client-ui/commit/f8f8d61829cfc409b369fa5af85db60d6107eedf))

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- remove click handler setting onTabContentFocusIn ([#1263](https://github.com/deephaven/web-client-ui/issues/1263)) ([7d56f97](https://github.com/deephaven/web-client-ui/commit/7d56f97aceae6329a188b13f89a7df2e7add7395))

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

**Note:** Version bump only for package @deephaven/golden-layout

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Bug Fixes

- Preview did not draw correctly when dragging Grids ([#1183](https://github.com/deephaven/web-client-ui/issues/1183)) ([1a0ff8d](https://github.com/deephaven/web-client-ui/commit/1a0ff8da23c69859ac54531d681fa2356267bab8)), closes [#1112](https://github.com/deephaven/web-client-ui/issues/1112)

### Features

- Double click notebook tab to remove its preview status ([#1190](https://github.com/deephaven/web-client-ui/issues/1190)) ([4870171](https://github.com/deephaven/web-client-ui/commit/4870171defd2f361295105489c87a41b2c8d1f3a)), closes [#1189](https://github.com/deephaven/web-client-ui/issues/1189)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/golden-layout

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

### Bug Fixes

- DH-14240 hasHeaders false should hide header bar ([#1086](https://github.com/deephaven/web-client-ui/issues/1086)) ([28d97ad](https://github.com/deephaven/web-client-ui/commit/28d97ade8886c234f47a6413b5a1e93480d4e6a2))

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/golden-layout

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/golden-layout
