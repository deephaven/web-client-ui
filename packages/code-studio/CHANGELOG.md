# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/code-studio

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

### Bug Fixes

- DH-14657 Disconnect handling increase debounce timeout ([#1347](https://github.com/deephaven/web-client-ui/issues/1347)) ([66bdad8](https://github.com/deephaven/web-client-ui/commit/66bdad8b548e62c938cc13bc9fe0dd7ca1257943))
- panels menu should only open downwards ([#1340](https://github.com/deephaven/web-client-ui/issues/1340)) ([a25be7f](https://github.com/deephaven/web-client-ui/commit/a25be7f0c0e043340bed88ad5a5923ab852917ee))

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/code-studio

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

### Bug Fixes

- Worker plugin definitions, optional panel wrapper for Dashboards ([#1329](https://github.com/deephaven/web-client-ui/issues/1329)) ([c32ffbc](https://github.com/deephaven/web-client-ui/commit/c32ffbcf66826c4e2da3ac82e5b5086524d05ec8))

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/code-studio

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Bug Fixes

- Search icon styleguide using prefixed string ([#1300](https://github.com/deephaven/web-client-ui/issues/1300)) ([0d02ab9](https://github.com/deephaven/web-client-ui/commit/0d02ab9b3d1284edfbce08e7650a1aea875012f3))

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212)) ([a17cc0e](https://github.com/deephaven/web-client-ui/commit/a17cc0eb2b4e8ba9240c891a15b9d4b7659fb721)), closes [#1151](https://github.com/deephaven/web-client-ui/issues/1151)
- Added new icons and added composition example to styleguide ([#1294](https://github.com/deephaven/web-client-ui/issues/1294)) ([97c7ead](https://github.com/deephaven/web-client-ui/commit/97c7ead4174e802b977962a9ff57dded5f4dd114))
- De-globalize JSAPI in Chart package ([#1258](https://github.com/deephaven/web-client-ui/issues/1258)) ([87fa2ef](https://github.com/deephaven/web-client-ui/commit/87fa2ef76e0482a1d641d8fea2d33fdad2996ef5))
- De-globalize JSAPI in Console package ([#1292](https://github.com/deephaven/web-client-ui/issues/1292)) ([3f12dd3](https://github.com/deephaven/web-client-ui/commit/3f12dd38a4db172697b3a7b39e6fbbd83d9f8519))
- De-globalize JSAPI in IrisGrid package ([#1262](https://github.com/deephaven/web-client-ui/issues/1262)) ([588cb8f](https://github.com/deephaven/web-client-ui/commit/588cb8fd080ac992da40e9b732d82e206032c9eb))
- De-globalize utils, formatters, linker ([#1278](https://github.com/deephaven/web-client-ui/issues/1278)) ([cb0e9ba](https://github.com/deephaven/web-client-ui/commit/cb0e9ba432a096cdb61c76787cff66c09a337372))

### Reverts

- Revert "feat: Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1296](https://github.com/deephaven/web-client-ui/issues/1296)) ([a80c6fc](https://github.com/deephaven/web-client-ui/commit/a80c6fc608466351d03358f47b9c7d062b28c9cf))

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

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- DH-14657 Better disconnect handling ([#1261](https://github.com/deephaven/web-client-ui/issues/1261)) ([9358e41](https://github.com/deephaven/web-client-ui/commit/9358e41fd3d7c587a45788819eec0962a8361202)), closes [#1149](https://github.com/deephaven/web-client-ui/issues/1149)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))
- Relative links ([#1204](https://github.com/deephaven/web-client-ui/issues/1204)) ([f440eb9](https://github.com/deephaven/web-client-ui/commit/f440eb9a19c437d2118ec2e6421e1ba4ebc4f56c)), closes [#1070](https://github.com/deephaven/web-client-ui/issues/1070) [#1070](https://github.com/deephaven/web-client-ui/issues/1070)

## [0.37.3](https://github.com/deephaven/web-client-ui/compare/v0.37.2...v0.37.3) (2023-04-25)

**Note:** Version bump only for package @deephaven/code-studio

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/code-studio

## [0.37.1](https://github.com/deephaven/web-client-ui/compare/v0.37.0...v0.37.1) (2023-04-25)

**Note:** Version bump only for package @deephaven/code-studio

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)
- Improve plugin load error handling ([#1214](https://github.com/deephaven/web-client-ui/issues/1214)) ([8ac7dc8](https://github.com/deephaven/web-client-ui/commit/8ac7dc826af579e129431b222524cb657b326099))

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

### Features

- Display workerName and processInfoId in the console status bar ([#1173](https://github.com/deephaven/web-client-ui/issues/1173)) ([85ce600](https://github.com/deephaven/web-client-ui/commit/85ce600ad63cd49504f75db5663ed64ec095749e))
- Pass optional envoyPrefix query param to CoreClient constructor ([#1219](https://github.com/deephaven/web-client-ui/issues/1219)) ([8b1e58c](https://github.com/deephaven/web-client-ui/commit/8b1e58cf1cb4a1aab18405b87160b223f04ccd9d))

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

### Features

- Added isACLEditor prop to Redux state ([#1201](https://github.com/deephaven/web-client-ui/issues/1201)) ([f39100a](https://github.com/deephaven/web-client-ui/commit/f39100a94ec195552a8f6cebf1f484c215f6c79a)), closes [#1200](https://github.com/deephaven/web-client-ui/issues/1200)

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Features

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

**Note:** Version bump only for package @deephaven/code-studio

## [0.31.1](https://github.com/deephaven/web-client-ui/compare/v0.31.0...v0.31.1) (2023-03-03)

**Note:** Version bump only for package @deephaven/code-studio

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

### Bug Fixes

- Add react-dom, redux and react-redux to remote component dependencies ([#1127](https://github.com/deephaven/web-client-ui/issues/1127)) ([d6c8a98](https://github.com/deephaven/web-client-ui/commit/d6c8a988d62157abfb8daadbff5db3eaef21a247))
- Fix the style guide ([#1119](https://github.com/deephaven/web-client-ui/issues/1119)) ([e4a75a1](https://github.com/deephaven/web-client-ui/commit/e4a75a1882335d1c4a3481005d7af8d9f2679f9a))

### Features

- Improve text labels based on suggestions from chatGPT ([#1118](https://github.com/deephaven/web-client-ui/issues/1118)) ([d852e49](https://github.com/deephaven/web-client-ui/commit/d852e495a81c26a9273d6f8a72d4ea9fe9a04668))

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

**Note:** Version bump only for package @deephaven/code-studio

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

### Features

- Import JS API as a module ([#1084](https://github.com/deephaven/web-client-ui/issues/1084)) ([9aab657](https://github.com/deephaven/web-client-ui/commit/9aab657ca674e404db6d3cf9b9c663627d635c2c)), closes [#444](https://github.com/deephaven/web-client-ui/issues/444)

### BREAKING CHANGES

- The JS API packaged as a module is now required for the
  `code-studio`, `embed-grid`, and `embed-chart` applications. Existing
  (Enterprise) applications should be able to use `jsapi-shim` still and
  load the JS API using the old method.

## [0.29.1](https://github.com/deephaven/web-client-ui/compare/v0.29.0...v0.29.1) (2023-02-10)

**Note:** Version bump only for package @deephaven/code-studio

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/code-studio
