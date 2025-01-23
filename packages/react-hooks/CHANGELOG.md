# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

### Bug Fixes

- Update react-spectrum packages ([#2303](https://github.com/deephaven/web-client-ui/issues/2303)) ([2216274](https://github.com/deephaven/web-client-ui/commit/2216274b416d9b1587a29c130dd19dd21accaa4b))

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

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

**Note:** Version bump only for package @deephaven/react-hooks

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Features

- Make rollup group behaviour a setting in the global settings menu ([#2183](https://github.com/deephaven/web-client-ui/issues/2183)) ([bc8d5f2](https://github.com/deephaven/web-client-ui/commit/bc8d5f24ac7f883c0f9d65ba47901f83f996e95c)), closes [#2128](https://github.com/deephaven/web-client-ui/issues/2128)

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Features

- Allow ref callback for Chart and ChartPanel ([#2174](https://github.com/deephaven/web-client-ui/issues/2174)) ([56d1fa9](https://github.com/deephaven/web-client-ui/commit/56d1fa9ba00d319794d686365be245c757ad2178))

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

### Bug Fixes

- `isElementOfType` Improved type inference ([#2099](https://github.com/deephaven/web-client-ui/issues/2099)) ([e13c9d7](https://github.com/deephaven/web-client-ui/commit/e13c9d78decdfba2ff76657a024b2df44f2ae0fc)), closes [#2094](https://github.com/deephaven/web-client-ui/issues/2094)

## [0.83.0](https://github.com/deephaven/web-client-ui/compare/v0.82.0...v0.83.0) (2024-06-25)

### Features

- ComboBoxNormalized - windowed data component ([#2072](https://github.com/deephaven/web-client-ui/issues/2072)) ([a30341a](https://github.com/deephaven/web-client-ui/commit/a30341a728625dc7fdc2b0a54b88dfc737977b7a)), closes [#2071](https://github.com/deephaven/web-client-ui/issues/2071)

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

### Bug Fixes

- Added `getKey` to `SelectionUtils.optimizeSelection` ([#1994](https://github.com/deephaven/web-client-ui/issues/1994)) ([4404894](https://github.com/deephaven/web-client-ui/commit/440489437de62b1e57cdbb7a85adeff97969f7f2))

### BREAKING CHANGES

- @deephaven/react-hooks:
  `SelectionUtils.optimizeSelection` and `useMappedSelection` require
  additional `getKey` arg

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

### Bug Fixes

- Typing in notebooks is laggy ([#1977](https://github.com/deephaven/web-client-ui/issues/1977)) ([47f9a57](https://github.com/deephaven/web-client-ui/commit/47f9a571e725311e429f703fd5332971a1f74f1a))

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Features

- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Features

- ListView components ([#1919](https://github.com/deephaven/web-client-ui/issues/1919)) ([b63ab18](https://github.com/deephaven/web-client-ui/commit/b63ab18033d1a8c218ad4cb7eccc252457c1d8d2))

### BREAKING CHANGES

- `LIST_VIEW_ROW_HEIGHT` number constant replaced with
  dictionary `LIST_VIEW_ROW_HEIGHTS`

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Features

- Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Features

- useDelay hook ([#1808](https://github.com/deephaven/web-client-ui/issues/1808)) ([445f9fe](https://github.com/deephaven/web-client-ui/commit/445f9fefc3c403f1b43031238d453105a3d1cc45)), closes [#1807](https://github.com/deephaven/web-client-ui/issues/1807)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Features

- DH-16336: usePickerWithSelectedValues - boolean flags should be calculated based on trimmed search text ([#1750](https://github.com/deephaven/web-client-ui/issues/1750)) ([228f34d](https://github.com/deephaven/web-client-ui/commit/228f34d40ca2f594e0a39b7975ff4668b065d101)), closes [#1747](https://github.com/deephaven/web-client-ui/issues/1747)

### BREAKING CHANGES

- `usePickerWithSelectedValues` now takes an object as an
  argument instead of positional args

# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

### Bug Fixes

- Handle undefined DashboardData props ([#1726](https://github.com/deephaven/web-client-ui/issues/1726)) ([45fa929](https://github.com/deephaven/web-client-ui/commit/45fa929586c0b13a738eceaa064b261eecbd8308)), closes [#1684](https://github.com/deephaven/web-client-ui/issues/1684) [#1685](https://github.com/deephaven/web-client-ui/issues/1685)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Features

- Add ResizeObserver to Grid and Chart ([#1626](https://github.com/deephaven/web-client-ui/issues/1626)) ([35311c8](https://github.com/deephaven/web-client-ui/commit/35311c832040b29e362c28f80983b4664c9aa1d5))

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)
- Heap usage should tick immediately when dependencies change ([#1468](https://github.com/deephaven/web-client-ui/issues/1468)) ([96b27a5](https://github.com/deephaven/web-client-ui/commit/96b27a50695eafaaf55d3a103c4c349225806afa)), closes [#1464](https://github.com/deephaven/web-client-ui/issues/1464)

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/react-hooks

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- DH-14630 - ACL Editor Hooks ([#1257](https://github.com/deephaven/web-client-ui/issues/1257)) ([e0a2a36](https://github.com/deephaven/web-client-ui/commit/e0a2a369ea3c90e9c2e25b7e29823825db14d3f5)), closes [#1260](https://github.com/deephaven/web-client-ui/issues/1260)

### BREAKING CHANGES

- `generateEmptyKeyedItemsRange` previously required a
  single `count` arg, but now requires a `start` and `end` index

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- DH-14657 Better disconnect handling ([#1261](https://github.com/deephaven/web-client-ui/issues/1261)) ([9358e41](https://github.com/deephaven/web-client-ui/commit/9358e41fd3d7c587a45788819eec0962a8361202)), closes [#1149](https://github.com/deephaven/web-client-ui/issues/1149)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)
- usePromiseFactory hook ([#1226](https://github.com/deephaven/web-client-ui/issues/1226)) ([f8c4ba3](https://github.com/deephaven/web-client-ui/commit/f8c4ba311b20958ab1b83c086fc94d9f61bf9ddd)), closes [#1221](https://github.com/deephaven/web-client-ui/issues/1221)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/react-hooks

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/react-hooks
