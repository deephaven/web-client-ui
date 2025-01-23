# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

### Features

- datetime tooltip to show full value ([#2286](https://github.com/deephaven/web-client-ui/issues/2286)) ([238f611](https://github.com/deephaven/web-client-ui/commit/238f611c1707c06170509eb093485620bb0c5801)), closes [#614](https://github.com/deephaven/web-client-ui/issues/614)

### Bug Fixes

- Allow double and float types to be rollupable ([#2311](https://github.com/deephaven/web-client-ui/issues/2311)) ([ab5b3b6](https://github.com/deephaven/web-client-ui/commit/ab5b3b65e42426b63027c3c520d68605809ce222)), closes [#2295](https://github.com/deephaven/web-client-ui/issues/2295)

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### Features

- add thousands format for numbers ([#2261](https://github.com/deephaven/web-client-ui/issues/2261)) ([0802f8a](https://github.com/deephaven/web-client-ui/commit/0802f8afc0eae6d4926ddee4ffcc29b327ce4d7c)), closes [#2253](https://github.com/deephaven/web-client-ui/issues/2253)

## [0.96.1](https://github.com/deephaven/web-client-ui/compare/v0.96.0...v0.96.1) (2024-10-11)

### Bug Fixes

- DH-17851: Fix snapshot error in TreeTable model when selection extends past viewport ([#2251](https://github.com/deephaven/web-client-ui/issues/2251)) ([cac799f](https://github.com/deephaven/web-client-ui/commit/cac799f25d62485015a72ebdaaba506df85e5ce0))
- DH-17861: Fix the warning about IrisGridModelUpdater render not being a pure function ([#2249](https://github.com/deephaven/web-client-ui/issues/2249)) ([9e83393](https://github.com/deephaven/web-client-ui/commit/9e833931f86671d1677d31bb7dbb45a13bb848bd))

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- DH-17537: Fix Advanced Filter dialog not showing the values list on tree tables ([#2232](https://github.com/deephaven/web-client-ui/issues/2232)) ([86e16ee](https://github.com/deephaven/web-client-ui/commit/86e16eec31eed6a4e89a18c6412d4396a724bac0))
- DH-17730: Fix Proxy Model Undefined Formatter ([#2237](https://github.com/deephaven/web-client-ui/issues/2237)) ([ee1bc2f](https://github.com/deephaven/web-client-ui/commit/ee1bc2f0d5d4bfe69ae667d51cc9d94bfed905d4))

## [0.95.0](https://github.com/deephaven/web-client-ui/compare/v0.94.0...v0.95.0) (2024-09-20)

### ⚠ BREAKING CHANGES

- eslint rule will require type only imports where
  possible

### Code Refactoring

- Added consistent-type-imports eslint rule and ran --fix ([#2230](https://github.com/deephaven/web-client-ui/issues/2230)) ([2744f97](https://github.com/deephaven/web-client-ui/commit/2744f9793aeac2b70e475a725447dcba1b5f294c)), closes [#2229](https://github.com/deephaven/web-client-ui/issues/2229)

## [0.94.0](https://github.com/deephaven/web-client-ui/compare/v0.93.0...v0.94.0) (2024-09-18)

### ⚠ BREAKING CHANGES

- TestUtils has been moved to new package
  `@deephaven-test-utils`. Consumers will need to install the new package
  as a dev dependency and update references.

### Code Refactoring

- Split out @deephaven/test-utils package ([#2225](https://github.com/deephaven/web-client-ui/issues/2225)) ([1d027d3](https://github.com/deephaven/web-client-ui/commit/1d027d3f6c0b47910cc0b8285c471e90c5f113a8)), closes [#2185](https://github.com/deephaven/web-client-ui/issues/2185)

## [0.93.0](https://github.com/deephaven/web-client-ui/compare/v0.92.0...v0.93.0) (2024-09-12)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Features

- Make rollup group behaviour a setting in the global settings menu ([#2183](https://github.com/deephaven/web-client-ui/issues/2183)) ([bc8d5f2](https://github.com/deephaven/web-client-ui/commit/bc8d5f24ac7f883c0f9d65ba47901f83f996e95c)), closes [#2128](https://github.com/deephaven/web-client-ui/issues/2128)

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

### Features

- Deephaven UI table databar support ([#2190](https://github.com/deephaven/web-client-ui/issues/2190)) ([b5ce598](https://github.com/deephaven/web-client-ui/commit/b5ce598478797125371ae0952ab6e84aca07efba))

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

### Bug Fixes

- Proxy model not setting defined values in parent class ([#2187](https://github.com/deephaven/web-client-ui/issues/2187)) ([5f9cf7f](https://github.com/deephaven/web-client-ui/commit/5f9cf7f4f39cb19f680e38f907d67201389fea7f))

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Bug Fixes

- Check for the getBaseTable API before calling it ([#2168](https://github.com/deephaven/web-client-ui/issues/2168)) ([a5cb947](https://github.com/deephaven/web-client-ui/commit/a5cb94745797e5568826c26ed0cf8e60131326d2))
- Input Tables cannot paste more rows than number of visible rows ([#2152](https://github.com/deephaven/web-client-ui/issues/2152)) ([1d51585](https://github.com/deephaven/web-client-ui/commit/1d515850af5affe2ec3ce116cc526097f1c4f389))

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

### ⚠ BREAKING CHANGES

- Fix any try / catch blocks that return non-awaited
  Promises

### Features

- Adjustable grid density ([#2151](https://github.com/deephaven/web-client-ui/issues/2151)) ([6bb11f9](https://github.com/deephaven/web-client-ui/commit/6bb11f9a527310801041011be3be78cae07a8bc8)), closes [#885](https://github.com/deephaven/web-client-ui/issues/885)

### Bug Fixes

- Enabled @typescript-eslint/return-await rule and fixed offending code ([#2157](https://github.com/deephaven/web-client-ui/issues/2157)) ([7875d03](https://github.com/deephaven/web-client-ui/commit/7875d03fdbe2dfa1c051c6dfa42cc1d9e7469afb)), closes [#2154](https://github.com/deephaven/web-client-ui/issues/2154)

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

### Features

- IrisGridTheme iconSize ([#2123](https://github.com/deephaven/web-client-ui/issues/2123)) ([58ee88d](https://github.com/deephaven/web-client-ui/commit/58ee88dc92bfe9a283ebc789c93f23639a954ba3)), closes [#885](https://github.com/deephaven/web-client-ui/issues/885)
- Partitioned Table UI Enhancements ([#2110](https://github.com/deephaven/web-client-ui/issues/2110)) ([de5ce40](https://github.com/deephaven/web-client-ui/commit/de5ce405dde8d62777f7a17201e121b22fe26fdb)), closes [#2079](https://github.com/deephaven/web-client-ui/issues/2079) [#2066](https://github.com/deephaven/web-client-ui/issues/2066) [#2103](https://github.com/deephaven/web-client-ui/issues/2103) [#2104](https://github.com/deephaven/web-client-ui/issues/2104) [#2105](https://github.com/deephaven/web-client-ui/issues/2105) [#2106](https://github.com/deephaven/web-client-ui/issues/2106) [#2107](https://github.com/deephaven/web-client-ui/issues/2107) [#2108](https://github.com/deephaven/web-client-ui/issues/2108) [#2109](https://github.com/deephaven/web-client-ui/issues/2109) [#2049](https://github.com/deephaven/web-client-ui/issues/2049) [#2120](https://github.com/deephaven/web-client-ui/issues/2120) [#1904](https://github.com/deephaven/web-client-ui/issues/1904)

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

### Bug Fixes

- Update IrisGridContextMenuHandler getHeaderActions return type to be more permissive ([#2117](https://github.com/deephaven/web-client-ui/issues/2117)) ([4e08b79](https://github.com/deephaven/web-client-ui/commit/4e08b79a1555fb9959fcf0f6d4fecc8c7eff0467))

## [0.83.0](https://github.com/deephaven/web-client-ui/compare/v0.82.0...v0.83.0) (2024-06-25)

### ⚠ BREAKING CHANGES

- ComboBox component has been replaced.
  To migrate to new version:

* Passing children is used instead of `options` prop to define dropdown
  items. For cases where option value and display are the same, passing an
  array of values as `children` will work. For cases where value and
  display differ, `Item` elements must be passed as children. e.g. `<Item
key={value}>{display}</Item>`
  e.g.

```typescript
// values will be used for display + value
const items = useMemo(
  () => ['Aaa', 'Bbb', 'Ccc'],
  []
)
<ComboBox>{items}</ComboBox>
```

```typescript
<ComboBox>
  <Item key="aaa">Aaa</Item>
  <Item key="bbb">Bbb</Item>
  <Item key="ccc">Ccc</Item>
</ComboBox>
```

- The `spellcheck=false` prop is no longer supported or needed
- `searchPlaceholder` and `inputPlaceholder` props are no longer
  supported and should be omitted. There is an optional `description` prop
  for cases where a descriptive label is desired. There is also a `label`
  prop for the primary component label.

### Features

- ComboBox - @deephaven/components ([#2067](https://github.com/deephaven/web-client-ui/issues/2067)) ([640e002](https://github.com/deephaven/web-client-ui/commit/640e002f85ea86961a22695c9c7659ca5d1de1ee)), closes [#2065](https://github.com/deephaven/web-client-ui/issues/2065)
- Export iris-grid mouse handlers ([#2083](https://github.com/deephaven/web-client-ui/issues/2083)) ([336c078](https://github.com/deephaven/web-client-ui/commit/336c07872af4f750c8b3d38638a8893670e0881a))

### Bug Fixes

- DH-17199: Filter by value in the tree table context menu always shows null ([#2078](https://github.com/deephaven/web-client-ui/issues/2078)) ([4eb38dd](https://github.com/deephaven/web-client-ui/commit/4eb38dd2c47071516269662f8a975044e6bb0a9a))

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

### ⚠ BREAKING CHANGES

- Removed
  `TreeTableViewportUpdater`,`TableViewportUpdater`, and
  `StorageTableViewportUpdater`. If wanting to continue using them, copy
  the deleted files from this PR.

### Features

- Allow custom renderer to be passed into IrisGrid ([#2061](https://github.com/deephaven/web-client-ui/issues/2061)) ([41233b5](https://github.com/deephaven/web-client-ui/commit/41233b5f4ed49b8af63506ca5d2af6653ab5eb9c))

### Bug Fixes

- Editing issues when key columns are not first columns ([#2053](https://github.com/deephaven/web-client-ui/issues/2053)) ([1bbcc73](https://github.com/deephaven/web-client-ui/commit/1bbcc73ddaa51502d8e14b2bffd3414998d6436a))
- Remove TreeTableViewportUpdater, TableViewportUpdater, and StorageTableViewportUpdater ([#2057](https://github.com/deephaven/web-client-ui/issues/2057)) ([0943041](https://github.com/deephaven/web-client-ui/commit/09430415ab91636b24c9388e87c0a45a1807aaeb))

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

### Bug Fixes

- Console error when opening context menu on tree table ([#2047](https://github.com/deephaven/web-client-ui/issues/2047)) ([77bea7d](https://github.com/deephaven/web-client-ui/commit/77bea7d2badbc37eb3259a85873d6f900a07be14))
- DH-17076 LayoutHints on TreeTables were not being applied ([#2041](https://github.com/deephaven/web-client-ui/issues/2041)) ([2977dd2](https://github.com/deephaven/web-client-ui/commit/2977dd262ae4b8dcd82e4622fb6f61b6c4e7b06e)), closes [#2035](https://github.com/deephaven/web-client-ui/issues/2035)

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))

### Features

- Replaced `RadioGroup` with Spectrum's ([#2020](https://github.com/deephaven/web-client-ui/issues/2020)) ([#2021](https://github.com/deephaven/web-client-ui/issues/2021)) ([c9ac72d](https://github.com/deephaven/web-client-ui/commit/c9ac72daddc4bc63012a675aa801af8ee807eff6))

### BREAKING CHANGES

- `RadioGroup` has been replaced by Spectrum
  `RadioGroup`. `RadioItem` has been replaced by Spectrum `Radio`

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

### Bug Fixes

- "Delete Selected Rows" bug for tables with no key columns ([#1996](https://github.com/deephaven/web-client-ui/issues/1996)) ([37fe009](https://github.com/deephaven/web-client-ui/commit/37fe00914253822a56033bee49570e82caff9334))
- Use picker for iris grid partition selector ([#2012](https://github.com/deephaven/web-client-ui/issues/2012)) ([b61c518](https://github.com/deephaven/web-client-ui/commit/b61c51840ae5f83dc00bf9dab0d1e6a7e4ba64d5))

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

### Bug Fixes

- remove extra padding on column statistic refresh button ([#1984](https://github.com/deephaven/web-client-ui/issues/1984)) ([dc29aa9](https://github.com/deephaven/web-client-ui/commit/dc29aa92de83f1aedeeb787ce89ed442d3536867))

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

### Performance Improvements

- Use `fast-deep-equal` instead of `deep-equal ([#1979](https://github.com/deephaven/web-client-ui/issues/1979)) ([3f3de9f](https://github.com/deephaven/web-client-ui/commit/3f3de9fd6a150f59cf6bf8e08eb1c11f0d9d93e1))

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Bug Fixes

- Fix null partition filter ([#1954](https://github.com/deephaven/web-client-ui/issues/1954)) ([3a1f92b](https://github.com/deephaven/web-client-ui/commit/3a1f92be1183adf99b7b6a553684533cc9fab9d7)), closes [#1867](https://github.com/deephaven/web-client-ui/issues/1867)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Features

- improve table loading ([#1898](https://github.com/deephaven/web-client-ui/issues/1898)) ([9b14ee0](https://github.com/deephaven/web-client-ui/commit/9b14ee0958150ac928af52ad6c58eff9761d1b2b)), closes [#1865](https://github.com/deephaven/web-client-ui/issues/1865)

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

### Bug Fixes

- adjust alignment of search input next/previous buttons ([#1917](https://github.com/deephaven/web-client-ui/issues/1917)) ([c7fcd38](https://github.com/deephaven/web-client-ui/commit/c7fcd38d41d27d7ff3cc32222b16b44412611b71))

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Bug Fixes

- Invalid migration of legacy partitions ([#1892](https://github.com/deephaven/web-client-ui/issues/1892)) ([96298f6](https://github.com/deephaven/web-client-ui/commit/96298f6d9c0de44c73f0965eba2055997d17a2fa))

### Features

- Change autoclosing bracket behavior to beforeWhitespace ([#1905](https://github.com/deephaven/web-client-ui/issues/1905)) ([80207f4](https://github.com/deephaven/web-client-ui/commit/80207f4178aa4a524de70644a715e1f030b5122d))

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

### Bug Fixes

- swap goto tooltips ([#1860](https://github.com/deephaven/web-client-ui/issues/1860)) ([6236b47](https://github.com/deephaven/web-client-ui/commit/6236b477cfbc79ab9ef92dd120fefe52e0fd9b55)), closes [#1826](https://github.com/deephaven/web-client-ui/issues/1826)

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Bug Fixes

- Do not show Group column for tree-tables ([#1851](https://github.com/deephaven/web-client-ui/issues/1851)) ([1ce6aac](https://github.com/deephaven/web-client-ui/commit/1ce6aac82071303fdbed064e8b71b54f741d0a87)), closes [#1831](https://github.com/deephaven/web-client-ui/issues/1831) [#1853](https://github.com/deephaven/web-client-ui/issues/1853)
- hide expand all when not available ([#1854](https://github.com/deephaven/web-client-ui/issues/1854)) ([aa34ace](https://github.com/deephaven/web-client-ui/commit/aa34ace66982047113a5d29b1840d946b1a04399)), closes [#1822](https://github.com/deephaven/web-client-ui/issues/1822)

### Features

- Add support to pass in mouseHandlers into IrisGrid ([#1857](https://github.com/deephaven/web-client-ui/issues/1857)) ([acf32a6](https://github.com/deephaven/web-client-ui/commit/acf32a6d014b9b7cd8d1b10f08145992c6a589fd))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Bug Fixes

- keep active cell selection in first column from going offscreen ([#1823](https://github.com/deephaven/web-client-ui/issues/1823)) ([69e8cdd](https://github.com/deephaven/web-client-ui/commit/69e8cdd1d138c661ed56bbd5e03e31713e8113a4))

### Features

- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

### Bug Fixes

- Bind this to utils that moved from static to non-static with js api de-globalization ([#1795](https://github.com/deephaven/web-client-ui/issues/1795)) ([d137ee7](https://github.com/deephaven/web-client-ui/commit/d137ee7d33ac0b0babd3336624b5db608eca44ba))

### Features

- toggle empty/null rendering ([#1778](https://github.com/deephaven/web-client-ui/issues/1778)) ([ae94f1b](https://github.com/deephaven/web-client-ui/commit/ae94f1beeaa9224264dc93231164401f89673ebc)), closes [#1646](https://github.com/deephaven/web-client-ui/issues/1646)

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))
- sorting frozen columns ([#1749](https://github.com/deephaven/web-client-ui/issues/1749)) ([51e60c5](https://github.com/deephaven/web-client-ui/commit/51e60c5cc1bcdb5fb4e6ed74ad42d8b9507ff312)), closes [#1645](https://github.com/deephaven/web-client-ui/issues/1645)

### Features

- multiselect values ([#1736](https://github.com/deephaven/web-client-ui/issues/1736)) ([e6955c1](https://github.com/deephaven/web-client-ui/commit/e6955c1b330ae09d3bfbe3bbcb6d1bf303ea9b48)), closes [#1233](https://github.com/deephaven/web-client-ui/issues/1233)

### BREAKING CHANGES

- linker and iris grid custom cursor styling and assets
  are now provided by components directly. DHE css and svg files
  containing linker cursors should be removed/de-duplicated.

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

### Bug Fixes

- Load full uncoalesced table if no partition columns available ([#1767](https://github.com/deephaven/web-client-ui/issues/1767)) ([e6dd3e1](https://github.com/deephaven/web-client-ui/commit/e6dd3e16a6018bfa0a11321d807015ce97f692fd)), closes [#1763](https://github.com/deephaven/web-client-ui/issues/1763)

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

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

- keep manually entered value in GoToRow when changing to same column type ([#1743](https://github.com/deephaven/web-client-ui/issues/1743)) ([689a1e2](https://github.com/deephaven/web-client-ui/commit/689a1e2fda9a9dd9e50ae200b0ad0f2b69b1bdbc)), closes [#1562](https://github.com/deephaven/web-client-ui/issues/1562)

### Features

- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
- double-clicking grid rows should select the row rather than toggle selection twice ([#1740](https://github.com/deephaven/web-client-ui/issues/1740)) ([f892e97](https://github.com/deephaven/web-client-ui/commit/f892e9764b596dae6bb33773d309c74bf1978470)), closes [#1704](https://github.com/deephaven/web-client-ui/issues/1704)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Bug Fixes

- GoToRow timestamp fails when selected row is out of view ([#1717](https://github.com/deephaven/web-client-ui/issues/1717)) ([9ddc973](https://github.com/deephaven/web-client-ui/commit/9ddc973108a6cc88999003c2d0dc6b48044967cc)), closes [#1561](https://github.com/deephaven/web-client-ui/issues/1561)
- Interface for IrisGridTableModelTemplate.backgroundColorForCell ([#1699](https://github.com/deephaven/web-client-ui/issues/1699)) ([73e1837](https://github.com/deephaven/web-client-ui/commit/73e1837eb2fdb161779724a8b275f4d8147b95c0)), closes [#1697](https://github.com/deephaven/web-client-ui/issues/1697)

### Features

- theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))

### BREAKING CHANGES

- - Subclasses of IrisGridTableModelTemplate or it's subclasses that use
    backgroundColorForCell may need to update their signature to accept the
    theme if they are calling the superclass

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Features

- "Group" column for rollup/tree tables ([#1636](https://github.com/deephaven/web-client-ui/issues/1636)) ([ba1d51b](https://github.com/deephaven/web-client-ui/commit/ba1d51baf20d5426746243ed0022848747dc44f8)), closes [#1555](https://github.com/deephaven/web-client-ui/issues/1555)
- Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

### Bug Fixes

- Made selector return types generic ([#1688](https://github.com/deephaven/web-client-ui/issues/1688)) ([b2972f0](https://github.com/deephaven/web-client-ui/commit/b2972f0dbf9e662eec6326acc6855aa1ddc85c41)), closes [#1687](https://github.com/deephaven/web-client-ui/issues/1687)

### Features

- Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Bug Fixes

- adjust filter bar colour ([#1666](https://github.com/deephaven/web-client-ui/issues/1666)) ([4c0200e](https://github.com/deephaven/web-client-ui/commit/4c0200e71e350fcf5261b0cc28440cb798bec207))
- convert organize columns component to purecomponent ([#1653](https://github.com/deephaven/web-client-ui/issues/1653)) ([8ddc114](https://github.com/deephaven/web-client-ui/commit/8ddc11458b0f52d7a96f673f061d60c63cb7b24a)), closes [#1650](https://github.com/deephaven/web-client-ui/issues/1650)
- Default to `Skip` operation instead of `Sum` operation ([#1648](https://github.com/deephaven/web-client-ui/issues/1648)) ([6083173](https://github.com/deephaven/web-client-ui/commit/608317358fe8eef0de365429265cfbd113340c33)), closes [#1355](https://github.com/deephaven/web-client-ui/issues/1355) [#1355](https://github.com/deephaven/web-client-ui/issues/1355)
- Unable to delete selected rows in some input tables ([#1678](https://github.com/deephaven/web-client-ui/issues/1678)) ([1e71550](https://github.com/deephaven/web-client-ui/commit/1e71550ac024e4b66c601fe2b85684b2463b905b)), closes [#1677](https://github.com/deephaven/web-client-ui/issues/1677)

### Features

- forward and back button for organize column search ([#1641](https://github.com/deephaven/web-client-ui/issues/1641)) ([89f2be5](https://github.com/deephaven/web-client-ui/commit/89f2be56647c977e4150f050ceec9e33f4c07680)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
- View cell contents in context menu ([#1657](https://github.com/deephaven/web-client-ui/issues/1657)) ([90b7517](https://github.com/deephaven/web-client-ui/commit/90b7517c42024cbefce3481e13a126c619def1fa)), closes [#1605](https://github.com/deephaven/web-client-ui/issues/1605)

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

### Features

- forward and back buttons for organize column search ([#1620](https://github.com/deephaven/web-client-ui/issues/1620)) ([75cf184](https://github.com/deephaven/web-client-ui/commit/75cf184f4b4b9d9a771544ea6335e5d2733368d9)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)

### Reverts

- feat: forward and back buttons for organize column search ([#1640](https://github.com/deephaven/web-client-ui/issues/1640)) ([737d1aa](https://github.com/deephaven/web-client-ui/commit/737d1aa98d04800377035d7d189219fefacfa23f))

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Features

- Add `LayoutManagerContext` and `useLayoutManager` ([#1625](https://github.com/deephaven/web-client-ui/issues/1625)) ([0a6965a](https://github.com/deephaven/web-client-ui/commit/0a6965a41953470cb032ef44d93497fa438783e4))
- Add ResizeObserver to Grid and Chart ([#1626](https://github.com/deephaven/web-client-ui/issues/1626)) ([35311c8](https://github.com/deephaven/web-client-ui/commit/35311c832040b29e362c28f80983b4664c9aa1d5))

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Features

- Add support for multi-partition parquet:kv tables ([#1580](https://github.com/deephaven/web-client-ui/issues/1580)) ([d92c91e](https://github.com/deephaven/web-client-ui/commit/d92c91e8b47f412e333a92e4e6649557eea99707)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143) [#1438](https://github.com/deephaven/web-client-ui/issues/1438)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Features

- Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))

### BREAKING CHANGES

- Enterprise will need ThemeProvider for the css
  variables to be available

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

### Bug Fixes

- Change display of rollup key columns from null to empty string ([#1563](https://github.com/deephaven/web-client-ui/issues/1563)) ([327bcb6](https://github.com/deephaven/web-client-ui/commit/327bcb649d47bff648a71fd7f979a63094650b25)), closes [#1483](https://github.com/deephaven/web-client-ui/issues/1483)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- data bar render from API ([#1415](https://github.com/deephaven/web-client-ui/issues/1415)) ([ee7d1c1](https://github.com/deephaven/web-client-ui/commit/ee7d1c108e86973b4c6855e482dce21d665dfe28)), closes [#0000](https://github.com/deephaven/web-client-ui/issues/0000) [#FF0000](https://github.com/deephaven/web-client-ui/issues/FF0000) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#00FF00](https://github.com/deephaven/web-client-ui/issues/00FF00)

### BREAKING CHANGES

- Inline LoadingSpinner instances will need to be
  decorated with `className="loading-spinner-vertical-align"` for vertical
  alignment to work as before

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

### Bug Fixes

- Copy did not work from embedded iframes ([#1528](https://github.com/deephaven/web-client-ui/issues/1528)) ([3549a33](https://github.com/deephaven/web-client-ui/commit/3549a33c6152660ed44601eb2e03312d694e6167)), closes [#1527](https://github.com/deephaven/web-client-ui/issues/1527)
- Render tables partitioned by non-string columns ([#1533](https://github.com/deephaven/web-client-ui/issues/1533)) ([585b2ff](https://github.com/deephaven/web-client-ui/commit/585b2ffc533dd95ff56247627c7ea1e0928f337b)), closes [#1441](https://github.com/deephaven/web-client-ui/issues/1441)

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

### Code Refactoring

- Improve table saver to always use the correct service worker ([#1515](https://github.com/deephaven/web-client-ui/issues/1515)) ([2488e52](https://github.com/deephaven/web-client-ui/commit/2488e52fdeda16604be2516c30782d6127be9317)), closes [#766](https://github.com/deephaven/web-client-ui/issues/766)

### Features

- Update go to row panel's row number with cursorRow ([#1508](https://github.com/deephaven/web-client-ui/issues/1508)) ([23ab5cc](https://github.com/deephaven/web-client-ui/commit/23ab5cc0f798304a274ed2de2473cc9c74ca84cb)), closes [#1406](https://github.com/deephaven/web-client-ui/issues/1406)

### BREAKING CHANGES

- `TableSaver` now expects the service worker to send it
  a complete URL for download instead of just a file name. DHE will need
  to adjust its `serviceWorker.js` to incorporate the same changes from
  this PR.

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

### Bug Fixes

- Hide "Append Command" button when viewing partition aware table in iframe UI ([#1495](https://github.com/deephaven/web-client-ui/issues/1495)) ([d15d6b1](https://github.com/deephaven/web-client-ui/commit/d15d6b1d174acd77c63c2dfc28a49ca08a4cd0ab)), closes [#1414](https://github.com/deephaven/web-client-ui/issues/1414)

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Bug Fixes

- quick filter focus text doesn't match canvas text ([#1475](https://github.com/deephaven/web-client-ui/issues/1475)) ([02841b5](https://github.com/deephaven/web-client-ui/commit/02841b5a9dedc25160f319a072636335aa77599f)), closes [#1472](https://github.com/deephaven/web-client-ui/issues/1472)
- Remove totals table rows from displayed row count ([#1492](https://github.com/deephaven/web-client-ui/issues/1492)) ([f686891](https://github.com/deephaven/web-client-ui/commit/f68689121c7df098dbf86fa76bf2ccf8dbda6566)), closes [#1407](https://github.com/deephaven/web-client-ui/issues/1407)

### Features

- Consolidate and normalize plugin types ([#1456](https://github.com/deephaven/web-client-ui/issues/1456)) ([43a782d](https://github.com/deephaven/web-client-ui/commit/43a782dd3ebf582b18e155fdbc313176b0bf0f84)), closes [#1454](https://github.com/deephaven/web-client-ui/issues/1454) [#1451](https://github.com/deephaven/web-client-ui/issues/1451)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- flaky e2e tests ([#1453](https://github.com/deephaven/web-client-ui/issues/1453)) ([d59e9be](https://github.com/deephaven/web-client-ui/commit/d59e9bed95152170626265a00ea27d716e1b2bcb))

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

### Bug Fixes

- Upgrade Monaco to ^0.41.0 ([#1448](https://github.com/deephaven/web-client-ui/issues/1448)) ([1120c2b](https://github.com/deephaven/web-client-ui/commit/1120c2b235d2ca2c8b14c818ccfc2847294c3811)), closes [#1445](https://github.com/deephaven/web-client-ui/issues/1445) [#1191](https://github.com/deephaven/web-client-ui/issues/1191)

### BREAKING CHANGES

- Monaco will need to be upgraded to ^0.41.0 in
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
  `      a
a`
- Wrote some Python code. Intellisense, syntax highlighting, and general
  typing experience seemed as expected
  - Execute full code + selected code successfully

## [0.45.1](https://github.com/deephaven/web-client-ui/compare/v0.45.0...v0.45.1) (2023-08-01)

**Note:** Version bump only for package @deephaven/iris-grid

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/iris-grid

## [0.44.1](https://github.com/deephaven/web-client-ui/compare/v0.44.0...v0.44.1) (2023-07-11)

### Bug Fixes

- tree and rollup default to non-sortable ([#1404](https://github.com/deephaven/web-client-ui/issues/1404)) ([5a8f34d](https://github.com/deephaven/web-client-ui/commit/5a8f34def53f03796fab265e2d1b1951480b5ecb)), closes [#1402](https://github.com/deephaven/web-client-ui/issues/1402)

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Features

- DH-14538: Export InputEditor and added options ([#1398](https://github.com/deephaven/web-client-ui/issues/1398)) ([405f42f](https://github.com/deephaven/web-client-ui/commit/405f42f9dfc880319c7d5afbf80d81b04965ec52)), closes [#1397](https://github.com/deephaven/web-client-ui/issues/1397)
- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Features

- DH-14538: Export InputEditor and added options ([#1398](https://github.com/deephaven/web-client-ui/issues/1398)) ([405f42f](https://github.com/deephaven/web-client-ui/commit/405f42f9dfc880319c7d5afbf80d81b04965ec52)), closes [#1397](https://github.com/deephaven/web-client-ui/issues/1397)
- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)

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
