# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/console





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)


### Bug Fixes

* Console History Not Scrolling to Bottom (DH-14062) ([#1481](https://github.com/deephaven/web-client-ui/issues/1481)) ([93687a7](https://github.com/deephaven/web-client-ui/commit/93687a78fa2d0e2da567efd8da2c671252ba8fe5))





## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)


### Bug Fixes

* Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)
* Zip CSV uploads not working ([#1457](https://github.com/deephaven/web-client-ui/issues/1457)) ([08d0296](https://github.com/deephaven/web-client-ui/commit/08d0296fee6a695c8312dec7d3bed648f10c7acb)), closes [#1080](https://github.com/deephaven/web-client-ui/issues/1080) [#1416](https://github.com/deephaven/web-client-ui/issues/1416)





# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)


### Bug Fixes

* Upgrade Monaco to ^0.41.0 ([#1448](https://github.com/deephaven/web-client-ui/issues/1448)) ([1120c2b](https://github.com/deephaven/web-client-ui/commit/1120c2b235d2ca2c8b14c818ccfc2847294c3811)), closes [#1445](https://github.com/deephaven/web-client-ui/issues/1445) [#1191](https://github.com/deephaven/web-client-ui/issues/1191)


### BREAKING CHANGES

* Monaco will need to be upgraded to ^0.41.0 in
Enterprise to ensure compatibility

**Tests Performed**

- Console Input
    - `Cmd+F` does nothing
    - Intellisense can be closed via `Esc`
- Log tab
    - `Esc` does not close find input
    - `Esc` does clear selection when focus is in the log content
- Code Editor
- Verified that newline with leading space no longer crashes the browser
tab
      ```
      a
       a
      ```
- Wrote some Python code. Intellisense, syntax highlighting, and general
typing experience seemed as expected
   - Execute full code + selected code successfully





## [0.45.1](https://github.com/deephaven/web-client-ui/compare/v0.45.0...v0.45.1) (2023-08-01)


### Bug Fixes

* Cannot import CSV with LOCAL_TIME ([#1434](https://github.com/deephaven/web-client-ui/issues/1434)) ([caa6bc8](https://github.com/deephaven/web-client-ui/commit/caa6bc8a801176b4624127aeb3c1e1cf1e346df3)), closes [#1432](https://github.com/deephaven/web-client-ui/issues/1432)





# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/console

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Features

- Outdent code when running selection from a notebook ([#1391](https://github.com/deephaven/web-client-ui/issues/1391)) ([154ccfc](https://github.com/deephaven/web-client-ui/commit/154ccfccd5a6f9996d67f0fcc71d031985bfd6a5)), closes [#1326](https://github.com/deephaven/web-client-ui/issues/1326)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Features

- Outdent code when running selection from a notebook ([#1391](https://github.com/deephaven/web-client-ui/issues/1391)) ([154ccfc](https://github.com/deephaven/web-client-ui/commit/154ccfccd5a6f9996d67f0fcc71d031985bfd6a5)), closes [#1326](https://github.com/deephaven/web-client-ui/issues/1326)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

**Note:** Version bump only for package @deephaven/console

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

### Bug Fixes

- DH-14972 Remove setSearch debounce in CommandHistoryViewportUpdater ([#1351](https://github.com/deephaven/web-client-ui/issues/1351)) ([2601146](https://github.com/deephaven/web-client-ui/commit/26011467be3bb5947a2cf34d78eaaaedc47d909b))

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/console

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/console

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

### Bug Fixes

- failing linter test from de-globalize PR ([#1321](https://github.com/deephaven/web-client-ui/issues/1321)) ([6ae174c](https://github.com/deephaven/web-client-ui/commit/6ae174c9b6ae222abc515f09d609747976d9d6d6))

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/console

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/console

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

### Bug Fixes

- Restrict link parsing so it requires protocol ([#1254](https://github.com/deephaven/web-client-ui/issues/1254)) ([0e286bd](https://github.com/deephaven/web-client-ui/commit/0e286bd28d6808297634ce389e820675f6cc5a49)), closes [#1252](https://github.com/deephaven/web-client-ui/issues/1252)

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/console

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

**Note:** Version bump only for package @deephaven/console

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/console

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/console

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Features

- Add signatureHelp and hover providers to monaco ([#1178](https://github.com/deephaven/web-client-ui/issues/1178)) ([f1f3abf](https://github.com/deephaven/web-client-ui/commit/f1f3abffc9df4178477714f06dcc57d40d6942a9))
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Added smarter caching for command history fetching ([#1145](https://github.com/deephaven/web-client-ui/issues/1145)) ([76b3bd5](https://github.com/deephaven/web-client-ui/commit/76b3bd51059638d5b864fabe8b4121b6a3554f17)), closes [#325](https://github.com/deephaven/web-client-ui/issues/325)

### Code Refactoring

- Fix fast refresh invalidations ([#1150](https://github.com/deephaven/web-client-ui/issues/1150)) ([2606826](https://github.com/deephaven/web-client-ui/commit/26068267c2cd67bc971b9537f8ce4108372167f5)), closes [#727](https://github.com/deephaven/web-client-ui/issues/727)

### Features

- Add clickable links in cell overflow modal ([#1147](https://github.com/deephaven/web-client-ui/issues/1147)) ([1ce9547](https://github.com/deephaven/web-client-ui/commit/1ce95473ff37d423ba8ac687c85fe278fbde9bd3)), closes [#1128](https://github.com/deephaven/web-client-ui/issues/1128)

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

**Note:** Version bump only for package @deephaven/console

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/console

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

**Note:** Version bump only for package @deephaven/console

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/console

## [0.29.1](https://github.com/deephaven/web-client-ui/compare/v0.29.0...v0.29.1) (2023-02-10)

### Bug Fixes

- DH-14237: down arrow in console not returning to blank field ([#1082](https://github.com/deephaven/web-client-ui/issues/1082)) ([e15c125](https://github.com/deephaven/web-client-ui/commit/e15c1256a11576d1fa9f258f0c9c63d111adf664)), closes [#646](https://github.com/deephaven/web-client-ui/issues/646)

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/console
