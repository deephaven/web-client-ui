# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.85.35](https://github.com/deephaven/web-client-ui/compare/v0.85.34...v0.85.35) (2025-09-22)

### Features

- DH-13515: Support expandable columns in grids v0.85 ([#2524](https://github.com/deephaven/web-client-ui/issues/2524)) ([c5d9663](https://github.com/deephaven/web-client-ui/commit/c5d9663192335e68d80a0d896e3e1d42eedd9361))

## [0.85.34](https://github.com/deephaven/web-client-ui/compare/v0.85.33...v0.85.34) (2025-07-23)

### Bug Fixes

- Columns not auto sizing correctly ([#2359](https://github.com/deephaven/web-client-ui/issues/2359)) ([#2497](https://github.com/deephaven/web-client-ui/issues/2497)) ([d0cd79b](https://github.com/deephaven/web-client-ui/commit/d0cd79bf34a7ba9164cd194ec3ebd0d6afae32f9))
- DH-19963: Remove grid-block-events when Grid unmounts ([#2507](https://github.com/deephaven/web-client-ui/issues/2507)) ([#2508](https://github.com/deephaven/web-client-ui/issues/2508)) ([dd2ed32](https://github.com/deephaven/web-client-ui/commit/dd2ed3276eab9ca048a95f7f45bd7ce163cfa5a5))
- Fix column width calculation logic in grid ([#2370](https://github.com/deephaven/web-client-ui/issues/2370)) ([#2499](https://github.com/deephaven/web-client-ui/issues/2499)) ([1c8f6e7](https://github.com/deephaven/web-client-ui/commit/1c8f6e7d80c03d8994c0496db13e39062ea24260))

## [0.85.31](https://github.com/deephaven/web-client-ui/compare/v0.85.30...v0.85.31) (2025-06-27)

### Features

- Add linker support to GridWidgetPlugin ([#2459](https://github.com/deephaven/web-client-ui/issues/2459)) ([#2473](https://github.com/deephaven/web-client-ui/issues/2473)) ([d8d621d](https://github.com/deephaven/web-client-ui/commit/d8d621df141e908c44e55ac349b2c9fc4f52475c))

### Bug Fixes

- Grid making unnecessary onSelectionChanged calls ([#2471](https://github.com/deephaven/web-client-ui/issues/2471)) ([#2472](https://github.com/deephaven/web-client-ui/issues/2472)) ([0bd1462](https://github.com/deephaven/web-client-ui/commit/0bd1462300a553baf3c9092b5f864f4b600a02ac))

## [0.85.28](https://github.com/deephaven/web-client-ui/compare/v0.85.27...v0.85.28) (2025-05-16)

### Bug Fixes

- Cherry-pick Simple Pivot prerequisites ([#2440](https://github.com/deephaven/web-client-ui/issues/2440)) ([94176fb](https://github.com/deephaven/web-client-ui/commit/94176fb19e5e2750c291bcc93fa405615e8709df)), closes [#2437](https://github.com/deephaven/web-client-ui/issues/2437)

## [0.85.21](https://github.com/deephaven/web-client-ui/compare/v0.85.20...v0.85.21) (2025-04-10)

### Bug Fixes

- Context menu using stale selection ([#2414](https://github.com/deephaven/web-client-ui/issues/2414)) ([5644dad](https://github.com/deephaven/web-client-ui/commit/5644dad25fdb02f51c77a1a134c91d0aa5ac84c8))

## [0.85.20](https://github.com/deephaven/web-client-ui/compare/v0.85.19...v0.85.20) (2025-04-09)

**Note:** Version bump only for package @deephaven/grid

## [0.85.19](https://github.com/deephaven/web-client-ui/compare/v0.85.18...v0.85.19) (2025-04-01)

**Note:** Version bump only for package @deephaven/grid

## [0.85.15](https://github.com/deephaven/web-client-ui/compare/v0.85.14...v0.85.15) (2025-02-27)

### Bug Fixes

- DH-18798 - token cache growing unbounded ([#2374](https://github.com/deephaven/web-client-ui/issues/2374)) ([#2376](https://github.com/deephaven/web-client-ui/issues/2376)) ([9d85d73](https://github.com/deephaven/web-client-ui/commit/9d85d73512085232495526f1d114da11eb90506d))

## [0.85.13](https://github.com/deephaven/web-client-ui/compare/v0.85.12...v0.85.13) (2025-01-10)

### Features

- Deephaven UI table databar support ([#2190](https://github.com/deephaven/web-client-ui/issues/2190)) ([#2340](https://github.com/deephaven/web-client-ui/issues/2340)) ([d8f667a](https://github.com/deephaven/web-client-ui/commit/d8f667ae69fada44456230a40be137ac8200104a))

## [0.85.10](https://github.com/deephaven/web-client-ui/compare/v0.85.9...v0.85.10) (2025-01-06)

### Features

- Adjustable grid density and icon size ([#2331](https://github.com/deephaven/web-client-ui/issues/2331)) ([d8d04fc](https://github.com/deephaven/web-client-ui/commit/d8d04fc929664fea9ee4613bc678f5915c723b18)), closes [#2123](https://github.com/deephaven/web-client-ui/issues/2123) [#2151](https://github.com/deephaven/web-client-ui/issues/2151) [#2187](https://github.com/deephaven/web-client-ui/issues/2187)

## [0.85.7](https://github.com/deephaven/web-client-ui/compare/v0.85.6...v0.85.7) (2024-12-16)

### Bug Fixes

- Input Tables cannot paste more rows than number of visible rows ([#2313](https://github.com/deephaven/web-client-ui/issues/2313)) ([bb424d1](https://github.com/deephaven/web-client-ui/commit/bb424d1cd7943e832a6790112176a7600be193a7))

## [0.85.3](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.85.3) (2024-07-23)

### Bug Fixes

- error when edited cell is out of grid viewport ([#2148](https://github.com/deephaven/web-client-ui/issues/2148)) ([e9e49e6](https://github.com/deephaven/web-client-ui/commit/e9e49e6b68e2c52abfe0fa6fbefd0bbd8d665085)), closes [#2087](https://github.com/deephaven/web-client-ui/issues/2087)

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/grid

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/grid

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

**Note:** Version bump only for package @deephaven/grid

## [0.83.0](https://github.com/deephaven/web-client-ui/compare/v0.82.0...v0.83.0) (2024-06-25)

**Note:** Version bump only for package @deephaven/grid

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

### Features

- Allow custom renderer to be passed into IrisGrid ([#2061](https://github.com/deephaven/web-client-ui/issues/2061)) ([41233b5](https://github.com/deephaven/web-client-ui/commit/41233b5f4ed49b8af63506ca5d2af6653ab5eb9c))

### Bug Fixes

- Editing issues when key columns are not first columns ([#2053](https://github.com/deephaven/web-client-ui/issues/2053)) ([1bbcc73](https://github.com/deephaven/web-client-ui/commit/1bbcc73ddaa51502d8e14b2bffd3414998d6436a))

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/grid

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/grid

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

**Note:** Version bump only for package @deephaven/grid

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

### Bug Fixes

- "Delete Selected Rows" bug for tables with no key columns ([#1996](https://github.com/deephaven/web-client-ui/issues/1996)) ([37fe009](https://github.com/deephaven/web-client-ui/commit/37fe00914253822a56033bee49570e82caff9334))

### Performance Improvements

- Improve performance of lots of grids in a dashboard ([#1987](https://github.com/deephaven/web-client-ui/issues/1987)) ([3de52d6](https://github.com/deephaven/web-client-ui/commit/3de52d6fa0512792c97928f65f0b4b1080da2c49))

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/grid

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

**Note:** Version bump only for package @deephaven/grid

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

**Note:** Version bump only for package @deephaven/grid

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/grid

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Bug Fixes

- Fix issues when auto-size columns/rows is false, and when row headers are not 0 ([#1927](https://github.com/deephaven/web-client-ui/issues/1927)) ([01c2a06](https://github.com/deephaven/web-client-ui/commit/01c2a064f287638382f0f7fe474098393b73b9ca))

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

**Note:** Version bump only for package @deephaven/grid

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

**Note:** Version bump only for package @deephaven/grid

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/grid

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/grid

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Add support to pass in mouseHandlers into IrisGrid ([#1857](https://github.com/deephaven/web-client-ui/issues/1857)) ([acf32a6](https://github.com/deephaven/web-client-ui/commit/acf32a6d014b9b7cd8d1b10f08145992c6a589fd))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/grid

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Bug Fixes

- keep active cell selection in first column from going offscreen ([#1823](https://github.com/deephaven/web-client-ui/issues/1823)) ([69e8cdd](https://github.com/deephaven/web-client-ui/commit/69e8cdd1d138c661ed56bbd5e03e31713e8113a4))

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/grid

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/grid

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))

### Features

- multiselect values ([#1736](https://github.com/deephaven/web-client-ui/issues/1736)) ([e6955c1](https://github.com/deephaven/web-client-ui/commit/e6955c1b330ae09d3bfbe3bbcb6d1bf303ea9b48)), closes [#1233](https://github.com/deephaven/web-client-ui/issues/1233)

### BREAKING CHANGES

- linker and iris grid custom cursor styling and assets
  are now provided by components directly. DHE css and svg files
  containing linker cursors should be removed/de-duplicated.

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/grid

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

**Note:** Version bump only for package @deephaven/grid

# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

### Features

- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Bug Fixes

- Interface for IrisGridTableModelTemplate.backgroundColorForCell ([#1699](https://github.com/deephaven/web-client-ui/issues/1699)) ([73e1837](https://github.com/deephaven/web-client-ui/commit/73e1837eb2fdb161779724a8b275f4d8147b95c0)), closes [#1697](https://github.com/deephaven/web-client-ui/issues/1697)

### BREAKING CHANGES

- - Subclasses of IrisGridTableModelTemplate or it's subclasses that use
    backgroundColorForCell may need to update their signature to accept the
    theme if they are calling the superclass

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Features

- "Group" column for rollup/tree tables ([#1636](https://github.com/deephaven/web-client-ui/issues/1636)) ([ba1d51b](https://github.com/deephaven/web-client-ui/commit/ba1d51baf20d5426746243ed0022848747dc44f8)), closes [#1555](https://github.com/deephaven/web-client-ui/issues/1555)
- Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/grid

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Features

- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

### Features

- Styleguide regression tests ([#1639](https://github.com/deephaven/web-client-ui/issues/1639)) ([561ff22](https://github.com/deephaven/web-client-ui/commit/561ff22714a8b39cc55b41549712b5ef23bd39cf)), closes [#1634](https://github.com/deephaven/web-client-ui/issues/1634)

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Bug Fixes

- Infinite loop with grid rendering ([#1631](https://github.com/deephaven/web-client-ui/issues/1631)) ([4875d2e](https://github.com/deephaven/web-client-ui/commit/4875d2e1e895478720950ad73f28d1b895114a58)), closes [#1626](https://github.com/deephaven/web-client-ui/issues/1626)
- non-contiguous table row selection background colour ([#1623](https://github.com/deephaven/web-client-ui/issues/1623)) ([61d1a53](https://github.com/deephaven/web-client-ui/commit/61d1a537ac9df31e3fe3dad95107b065a12ebd3b)), closes [#1619](https://github.com/deephaven/web-client-ui/issues/1619)
- remove unecessary dom re-calc in grid render ([#1632](https://github.com/deephaven/web-client-ui/issues/1632)) ([ce7cc3e](https://github.com/deephaven/web-client-ui/commit/ce7cc3e6104eb208b3b36e51f62d284dfd7f57bc))

### Features

- Add ResizeObserver to Grid and Chart ([#1626](https://github.com/deephaven/web-client-ui/issues/1626)) ([35311c8](https://github.com/deephaven/web-client-ui/commit/35311c832040b29e362c28f80983b4664c9aa1d5))

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Reverts

- "fix: stuck to bottom on filter clear" ([#1616](https://github.com/deephaven/web-client-ui/issues/1616)) ([806a6b6](https://github.com/deephaven/web-client-ui/commit/806a6b61543cfb13cd7905a9d42edb32aeb3c577)), closes [deephaven/web-client-ui#1579](https://github.com/deephaven/web-client-ui/issues/1579) [#1615](https://github.com/deephaven/web-client-ui/issues/1615)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

### Bug Fixes

- stuck to bottom on filter clear ([#1579](https://github.com/deephaven/web-client-ui/issues/1579)) ([ef52749](https://github.com/deephaven/web-client-ui/commit/ef527498970fd0d994d90d9824bc3a55582f5b4c)), closes [#1477](https://github.com/deephaven/web-client-ui/issues/1477) [#1571](https://github.com/deephaven/web-client-ui/issues/1571) [#1571](https://github.com/deephaven/web-client-ui/issues/1571)

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- cap width of columns with long names ([#1574](https://github.com/deephaven/web-client-ui/issues/1574)) ([876a6ac](https://github.com/deephaven/web-client-ui/commit/876a6acd00d239f3ac7df21e27db74a16e4fd1b7)), closes [#1276](https://github.com/deephaven/web-client-ui/issues/1276)

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

### Features

- data bar render from API ([#1415](https://github.com/deephaven/web-client-ui/issues/1415)) ([ee7d1c1](https://github.com/deephaven/web-client-ui/commit/ee7d1c108e86973b4c6855e482dce21d665dfe28)), closes [#0000](https://github.com/deephaven/web-client-ui/issues/0000) [#FF0000](https://github.com/deephaven/web-client-ui/issues/FF0000) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#00FF00](https://github.com/deephaven/web-client-ui/issues/00FF00)

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

### Bug Fixes

- Table overflow button has lower priority than grid tokens ([#1510](https://github.com/deephaven/web-client-ui/issues/1510)) ([32e6d20](https://github.com/deephaven/web-client-ui/commit/32e6d208d0977092f315caa122b8ab23f0fc110a)), closes [#1480](https://github.com/deephaven/web-client-ui/issues/1480)

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/grid

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

**Note:** Version bump only for package @deephaven/grid

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

**Note:** Version bump only for package @deephaven/grid

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/grid

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/grid

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/grid

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/grid

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Reverts

- adding back "Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1365](https://github.com/deephaven/web-client-ui/issues/1365)) ([8586d4d](https://github.com/deephaven/web-client-ui/commit/8586d4d99e55def1747eb820e824b61703990e58))

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/grid

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/grid

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/grid

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212)) ([a17cc0e](https://github.com/deephaven/web-client-ui/commit/a17cc0eb2b4e8ba9240c891a15b9d4b7659fb721)), closes [#1151](https://github.com/deephaven/web-client-ui/issues/1151)

### Reverts

- Revert "feat: Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1296](https://github.com/deephaven/web-client-ui/issues/1296)) ([a80c6fc](https://github.com/deephaven/web-client-ui/commit/a80c6fc608466351d03358f47b9c7d062b28c9cf))

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- Restrict link parsing so it requires protocol ([#1254](https://github.com/deephaven/web-client-ui/issues/1254)) ([0e286bd](https://github.com/deephaven/web-client-ui/commit/0e286bd28d6808297634ce389e820675f6cc5a49)), closes [#1252](https://github.com/deephaven/web-client-ui/issues/1252)

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/grid

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/grid

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/grid

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Bug Fixes

- Preview did not draw correctly when dragging Grids ([#1183](https://github.com/deephaven/web-client-ui/issues/1183)) ([1a0ff8d](https://github.com/deephaven/web-client-ui/commit/1a0ff8da23c69859ac54531d681fa2356267bab8)), closes [#1112](https://github.com/deephaven/web-client-ui/issues/1112)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Code Refactoring

- Fix fast refresh invalidations ([#1150](https://github.com/deephaven/web-client-ui/issues/1150)) ([2606826](https://github.com/deephaven/web-client-ui/commit/26068267c2cd67bc971b9537f8ce4108372167f5)), closes [#727](https://github.com/deephaven/web-client-ui/issues/727)

### BREAKING CHANGES

- Renamed `renderFileListItem` to `FileListItem`.
  Renamed `RenderFileListItemProps` to `FileListItemProps`.
  Removed exports for `ConsolePlugin.assertIsConsolePluginProps`,
  `GridPlugin.SUPPORTED_TYPES`, `FileList.getPathFromItem`,
  `FileList.DRAG_HOVER_TIMEOUT`, `FileList.getItemIcon`,
  `Grid.directionForKey`, `GotoRow.isIrisGridProxyModel`, and
  `Aggregations.SELECTABLE_OPTIONS`. These were all only being consumed
  within their own file and are not consumed in enterprise

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

### Bug Fixes

- Grid rendering header incorrectly when hiding all children in a group via layout hints ([#1139](https://github.com/deephaven/web-client-ui/issues/1139)) ([2fbccc6](https://github.com/deephaven/web-client-ui/commit/2fbccc60a7fe55264e7dceb260ba3962957a8eba)), closes [#1097](https://github.com/deephaven/web-client-ui/issues/1097)

### Features

- Add support for clickable links ([#1088](https://github.com/deephaven/web-client-ui/issues/1088)) ([f7f918e](https://github.com/deephaven/web-client-ui/commit/f7f918e7f0c5f1b0fb4030eb748010aaf4d196df)), closes [#712](https://github.com/deephaven/web-client-ui/issues/712)

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/grid

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/grid

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/grid
