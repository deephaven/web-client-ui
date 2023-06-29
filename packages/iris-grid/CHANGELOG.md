# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Bug Fixes

- DH-15032: Fix incorrect warning about updated shared state ([#1364](https://github.com/deephaven/web-client-ui/issues/1364)) ([9e53dd2](https://github.com/deephaven/web-client-ui/commit/9e53dd2796b84963bd90e7043122a6b2c4d3cf46))

### Features

- improvements to null and empty strings filters in grid ([#1348](https://github.com/deephaven/web-client-ui/issues/1348)) ([ed3a8c5](https://github.com/deephaven/web-client-ui/commit/ed3a8c5f224094306ff55f9b41706cb58ff709e2)), closes [#1243](https://github.com/deephaven/web-client-ui/issues/1243)

### Reverts

- adding back "Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1365](https://github.com/deephaven/web-client-ui/issues/1365)) ([8586d4d](https://github.com/deephaven/web-client-ui/commit/8586d4d99e55def1747eb820e824b61703990e58))

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Features

- add contains ignore case in go to row ([#1291](https://github.com/deephaven/web-client-ui/issues/1291)) ([d67712e](https://github.com/deephaven/web-client-ui/commit/d67712e4d031723ea76b429c79465b122ca4efc4)), closes [#1274](https://github.com/deephaven/web-client-ui/issues/1274)

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Bug Fixes

- add word-break to long column names in column tooltip ([#1290](https://github.com/deephaven/web-client-ui/issues/1290)) ([02215b6](https://github.com/deephaven/web-client-ui/commit/02215b6323c58678ae37578ea9d0e0dda68ff880)), closes [#1283](https://github.com/deephaven/web-client-ui/issues/1283)
- Select distinct throwing for tables with multiple columns ([#1286](https://github.com/deephaven/web-client-ui/issues/1286)) ([4b40e4b](https://github.com/deephaven/web-client-ui/commit/4b40e4b831c3dae4f7b869b71c7f6185560f929e)), closes [#1275](https://github.com/deephaven/web-client-ui/issues/1275)

### Features

- Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212)) ([a17cc0e](https://github.com/deephaven/web-client-ui/commit/a17cc0eb2b4e8ba9240c891a15b9d4b7659fb721)), closes [#1151](https://github.com/deephaven/web-client-ui/issues/1151)
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

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

### Bug Fixes

- Freezing a tree table column crashes the panel ([#1192](https://github.com/deephaven/web-client-ui/issues/1192)) ([5142a4d](https://github.com/deephaven/web-client-ui/commit/5142a4d7fc216034d2bd4218b928bfe0768c6dff)), closes [#1136](https://github.com/deephaven/web-client-ui/issues/1136)

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Bug Fixes

- Conditional formatting not being applied to custom columns ([#1181](https://github.com/deephaven/web-client-ui/issues/1181)) ([1e4f8f9](https://github.com/deephaven/web-client-ui/commit/1e4f8f92e246b417bb2c083a16978ca42ae63e61)), closes [#1135](https://github.com/deephaven/web-client-ui/issues/1135)
- Context menu does not appear when right-clicking IrisGrid component in styleguide ([#1184](https://github.com/deephaven/web-client-ui/issues/1184)) ([696cc2d](https://github.com/deephaven/web-client-ui/commit/696cc2d556081ccc0a70c6fc479d661a59c80c4a)), closes [#1065](https://github.com/deephaven/web-client-ui/issues/1065)
- Typing for WritableStream ([#1186](https://github.com/deephaven/web-client-ui/issues/1186)) ([dfdf356](https://github.com/deephaven/web-client-ui/commit/dfdf356e59a387811794884f13abbd95a163d247)), closes [#803](https://github.com/deephaven/web-client-ui/issues/803)

### Features

- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Error thrown when cell overflow position is unknown ([#1177](https://github.com/deephaven/web-client-ui/issues/1177)) ([bb24f61](https://github.com/deephaven/web-client-ui/commit/bb24f61018c5af9325c3e3dc36abd63c3b10d51a)), closes [#1116](https://github.com/deephaven/web-client-ui/issues/1116)
- Goto Value Skips Rows on String Column, Displays Incorrect Filter, and `shift+enter` Doesn't go to Previous ([#1162](https://github.com/deephaven/web-client-ui/issues/1162)) ([e83d7c9](https://github.com/deephaven/web-client-ui/commit/e83d7c9f7265fc6402a347fa8826cef16ad3c93f)), closes [#1156](https://github.com/deephaven/web-client-ui/issues/1156) [#1157](https://github.com/deephaven/web-client-ui/issues/1157)
- Handling no columns ([#1170](https://github.com/deephaven/web-client-ui/issues/1170)) ([2ac25ae](https://github.com/deephaven/web-client-ui/commit/2ac25aed8afb51272c46050a1a0d278da9a87bc6)), closes [#1169](https://github.com/deephaven/web-client-ui/issues/1169)
- Scrolling horizontally in Linker mode renders empty cells ([#1160](https://github.com/deephaven/web-client-ui/issues/1160)) ([e314be6](https://github.com/deephaven/web-client-ui/commit/e314be6d32792aea3791ee5189fd45d37c86011c)), closes [#1146](https://github.com/deephaven/web-client-ui/issues/1146)

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

### Bug Fixes

- DH-12163 - Column grouping sidebar test failure fixes ([#1142](https://github.com/deephaven/web-client-ui/issues/1142)) ([a55308d](https://github.com/deephaven/web-client-ui/commit/a55308d736e98a730e4512a5b3c199f693d2a62b))
- Fixed rollup divider position ([#1125](https://github.com/deephaven/web-client-ui/issues/1125)) ([859bfa2](https://github.com/deephaven/web-client-ui/commit/859bfa290cf7bc5e920c6c8a02cbbc91f95b3999)), closes [#1062](https://github.com/deephaven/web-client-ui/issues/1062)

### Code Refactoring

- Replace usage of Column.index with column name ([#1126](https://github.com/deephaven/web-client-ui/issues/1126)) ([7448a88](https://github.com/deephaven/web-client-ui/commit/7448a88a651f82416de9c2aa0ebbbb217a6eae5c)), closes [#965](https://github.com/deephaven/web-client-ui/issues/965)

### Features

- Add support for clickable links ([#1088](https://github.com/deephaven/web-client-ui/issues/1088)) ([f7f918e](https://github.com/deephaven/web-client-ui/commit/f7f918e7f0c5f1b0fb4030eb748010aaf4d196df)), closes [#712](https://github.com/deephaven/web-client-ui/issues/712)

### BREAKING CHANGES

- Removed index property from dh.types Column type.
  IrisGridUtils.dehydrateSort now returns column name instead of index.
  TableUtils now expects column name instead of index for functions that
  don't have access to a columns array.

## [0.31.1](https://github.com/deephaven/web-client-ui/compare/v0.31.0...v0.31.1) (2023-03-03)

### Bug Fixes

- Aggregations should be available when creating a rollup ([#1129](https://github.com/deephaven/web-client-ui/issues/1129)) ([c3d8433](https://github.com/deephaven/web-client-ui/commit/c3d8433206f7855bd5a8e27ad63d5e33e40943fe)), closes [/github.com/deephaven/web-client-ui/blob/a069543812b6c544957ebf664e0918e98a3affbf/packages/iris-grid/src/IrisGrid.tsx#L1288](https://github.com//github.com/deephaven/web-client-ui/blob/a069543812b6c544957ebf664e0918e98a3affbf/packages/iris-grid/src/IrisGrid.tsx/issues/L1288)

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

### Bug Fixes

- Added date time parsing for conditional formatting ([#1120](https://github.com/deephaven/web-client-ui/issues/1120)) ([4c7710e](https://github.com/deephaven/web-client-ui/commit/4c7710ece0d5cdfb3b196b06a396f2e760460ef9)), closes [#1108](https://github.com/deephaven/web-client-ui/issues/1108)
- Conditional date formatting ([#1104](https://github.com/deephaven/web-client-ui/issues/1104)) ([2f503ba](https://github.com/deephaven/web-client-ui/commit/2f503bad83ef132b0cf9739803dc5014781a617b))
- Disable applying "No formatting" ([#1107](https://github.com/deephaven/web-client-ui/issues/1107)) ([14020f1](https://github.com/deephaven/web-client-ui/commit/14020f156c7a61fa48323fdb68c99f5161a4ff10)), closes [#1106](https://github.com/deephaven/web-client-ui/issues/1106)
- Select Distinct Column Throws `null` error ([#1101](https://github.com/deephaven/web-client-ui/issues/1101)) ([144605a](https://github.com/deephaven/web-client-ui/commit/144605a533da29283aa5059f3f968402429c5e08)), closes [#1100](https://github.com/deephaven/web-client-ui/issues/1100)

### Features

- Goto Value Improvements ([#1072](https://github.com/deephaven/web-client-ui/issues/1072)) ([970a575](https://github.com/deephaven/web-client-ui/commit/970a57574145a6e44694dbac27b6938c8b4b1e9e)), closes [#1027](https://github.com/deephaven/web-client-ui/issues/1027)
- Improve text labels based on suggestions from chatGPT ([#1118](https://github.com/deephaven/web-client-ui/issues/1118)) ([d852e49](https://github.com/deephaven/web-client-ui/commit/d852e495a81c26a9273d6f8a72d4ea9fe9a04668))

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

### Bug Fixes

- add missing return for editvalueforcell, missing from TS conversion ([#1090](https://github.com/deephaven/web-client-ui/issues/1090)) ([1b00840](https://github.com/deephaven/web-client-ui/commit/1b00840886051bf2d7393185ecb8047fa977de49)), closes [#1087](https://github.com/deephaven/web-client-ui/issues/1087)

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.29.1](https://github.com/deephaven/web-client-ui/compare/v0.29.0...v0.29.1) (2023-02-10)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

### Features

- Expandable rows shows tooltip ([#1068](https://github.com/deephaven/web-client-ui/issues/1068)) ([f2efc0a](https://github.com/deephaven/web-client-ui/commit/f2efc0ad24972ff1e9aa5887ec8bb871c9840a9c)), closes [#1061](https://github.com/deephaven/web-client-ui/issues/1061)
- Update ^ in shorcut to "Ctrl+" per windows guidelines ([#1069](https://github.com/deephaven/web-client-ui/issues/1069)) ([60c955a](https://github.com/deephaven/web-client-ui/commit/60c955a95f87b29d2347847849d128133bdc3b99))
