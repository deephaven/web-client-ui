# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

### Bug Fixes

- ComboBox show all items on open ([#2328](https://github.com/deephaven/web-client-ui/issues/2328)) ([c08bb7b](https://github.com/deephaven/web-client-ui/commit/c08bb7bacd579bd868ad2c2874cf9db0c5404e66))

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### ⚠ BREAKING CHANGES

- `RefreshToken` related classes have been removed from `@deephaven/jsapi-components`. This functionality did not actually work in Core, and was unused. The `RefreshToken` type is now defined in `@deephaven/jsapi-types`, as `dh.RefreshToken`.

### Bug Fixes

- Remove RefreshBootstrap and refresh token handling ([#2257](https://github.com/deephaven/web-client-ui/issues/2257)) ([5686032](https://github.com/deephaven/web-client-ui/commit/5686032603e583de4cc85e320f189f4b17de4e47))

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

**Note:** Version bump only for package @deephaven/jsapi-components

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

### Bug Fixes

- Use correct offset in snapshot ([#2217](https://github.com/deephaven/web-client-ui/issues/2217)) ([a479d6c](https://github.com/deephaven/web-client-ui/commit/a479d6c5f907f53aaa6500845ea168ab0eb9bb09))

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

### Features

- ComboBox - @deephaven/jsapi-components ([#2077](https://github.com/deephaven/web-client-ui/issues/2077)) ([115e057](https://github.com/deephaven/web-client-ui/commit/115e057114257a186c4a9a006a1958e03b7470c5)), closes [#2074](https://github.com/deephaven/web-client-ui/issues/2074)

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

### ⚠ BREAKING CHANGES

- - @deephaven/jsapi-components - The contract of
    `useSearchableViewportData` to be more consistent with
    `useViewportData`. `usePickerWithSelectedValues` now requires
    `timeZone`.

* @deephaven/jsapi-utils - `createSearchTextFilter` requires `timeZone`

### Features

- useSearchableViewportData - support non-text filters ([#2092](https://github.com/deephaven/web-client-ui/issues/2092)) ([7009e21](https://github.com/deephaven/web-client-ui/commit/7009e2142d6f1624d0810a027e19e3a2b567e38a)), closes [#2102](https://github.com/deephaven/web-client-ui/issues/2102) [#2091](https://github.com/deephaven/web-client-ui/issues/2091)

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

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

### Bug Fixes

- useViewportData - memoize subscriptions and first row of viewport ([#2008](https://github.com/deephaven/web-client-ui/issues/2008)) ([2246a4a](https://github.com/deephaven/web-client-ui/commit/2246a4a1ef087db060f2130c5a2d7c1e037746b4)), closes [#2003](https://github.com/deephaven/web-client-ui/issues/2003) [#1928](https://github.com/deephaven/web-client-ui/issues/1928)

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

### Bug Fixes

- Added `getKey` to `SelectionUtils.optimizeSelection` ([#1994](https://github.com/deephaven/web-client-ui/issues/1994)) ([4404894](https://github.com/deephaven/web-client-ui/commit/440489437de62b1e57cdbb7a85adeff97969f7f2))

### BREAKING CHANGES

- @deephaven/react-hooks:
  `SelectionUtils.optimizeSelection` and `useMappedSelection` require
  additional `getKey` arg

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Bug Fixes

- Fix null partition filter ([#1954](https://github.com/deephaven/web-client-ui/issues/1954)) ([3a1f92b](https://github.com/deephaven/web-client-ui/commit/3a1f92be1183adf99b7b6a553684533cc9fab9d7)), closes [#1867](https://github.com/deephaven/web-client-ui/issues/1867)

### Features

- ListView + Picker - Item icon support ([#1959](https://github.com/deephaven/web-client-ui/issues/1959)) ([cb13c60](https://github.com/deephaven/web-client-ui/commit/cb13c6094f2f416e7682da67fde9fc05f68b9b17)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890)
- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Features

- ListView components ([#1919](https://github.com/deephaven/web-client-ui/issues/1919)) ([b63ab18](https://github.com/deephaven/web-client-ui/commit/b63ab18033d1a8c218ad4cb7eccc252457c1d8d2))

### BREAKING CHANGES

- `LIST_VIEW_ROW_HEIGHT` number constant replaced with
  dictionary `LIST_VIEW_ROW_HEIGHTS`

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

### Features

- Picker - formatter settings ([#1907](https://github.com/deephaven/web-client-ui/issues/1907)) ([f06a141](https://github.com/deephaven/web-client-ui/commit/f06a141a611e1a86c9b6dcbff963d61e3bee7010)), closes [#1889](https://github.com/deephaven/web-client-ui/issues/1889)

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Features

- Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Features

- Test Utils - Generate exhaustive boolean combinations and MockProxy spread ([#1811](https://github.com/deephaven/web-client-ui/issues/1811)) ([0a2f054](https://github.com/deephaven/web-client-ui/commit/0a2f054591d04dd32c4919ce90fd538638e0b563)), closes [#1809](https://github.com/deephaven/web-client-ui/issues/1809)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

### Features

- Add ObjectFetcher context and useObjectFetcher hook ([#1753](https://github.com/deephaven/web-client-ui/issues/1753)) ([2cd46ce](https://github.com/deephaven/web-client-ui/commit/2cd46ce2d5107553d3f91933294638a5fb183245))

### BREAKING CHANGES

- - `useConnection` is moved from `jsapi-components` package to
    `app-utils` package

* Should only be used at the app level, as there could be multiple
  connections
* `WidgetDefinition` has been renamed to `WidgetDescriptor`

## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Features

- DH-16336: usePickerWithSelectedValues - boolean flags should be calculated based on trimmed search text ([#1750](https://github.com/deephaven/web-client-ui/issues/1750)) ([228f34d](https://github.com/deephaven/web-client-ui/commit/228f34d40ca2f594e0a39b7975ff4668b065d101)), closes [#1747](https://github.com/deephaven/web-client-ui/issues/1747)

### BREAKING CHANGES

- `usePickerWithSelectedValues` now takes an object as an
  argument instead of positional args

# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

### Features

- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Features

- Add `LayoutManagerContext` and `useLayoutManager` ([#1625](https://github.com/deephaven/web-client-ui/issues/1625)) ([0a6965a](https://github.com/deephaven/web-client-ui/commit/0a6965a41953470cb032ef44d93497fa438783e4))

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- Remove @deephaven/app-utils from @deephaven/dashboard-core-plugins dependency list ([#1596](https://github.com/deephaven/web-client-ui/issues/1596)) ([7b59763](https://github.com/deephaven/web-client-ui/commit/7b59763d528a95eaca32e4c9607c50d447215798)), closes [#1593](https://github.com/deephaven/web-client-ui/issues/1593)

### BREAKING CHANGES

- - `usePlugins` and `PluginsContext` were moved from
    `@deephaven/app-utils` to `@deephaven/plugin`.

* `useLoadTablePlugin` was moved from `@deephaven/app-utils` to
  `@deephaven/dashboard-core-plugins`.
* `useConnection` and `ConnectionContext` were moved from
  `@deephaven/app-utils` to `@deephaven/jsapi-components`.
* `DeephavenPluginModuleMap` was removed from `@deephaven/redux`. Use
  `PluginModuleMap` from `@deephaven/plugin` instead.

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Bug Fixes

- Export useTableUtils ([#1309](https://github.com/deephaven/web-client-ui/issues/1309)) ([9212107](https://github.com/deephaven/web-client-ui/commit/9212107142ae3863201bbb107e701e768c11f44f)), closes [#1308](https://github.com/deephaven/web-client-ui/issues/1308)

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Bug Fixes

- DH-14630: useDebouncedViewportSearch: memoization bug ([#1273](https://github.com/deephaven/web-client-ui/issues/1273)) ([be82b14](https://github.com/deephaven/web-client-ui/commit/be82b145501bd1af48e44f068cc157c088711823)), closes [#1272](https://github.com/deephaven/web-client-ui/issues/1272)

### Features

- De-globalize JSAPI in IrisGrid package ([#1262](https://github.com/deephaven/web-client-ui/issues/1262)) ([588cb8f](https://github.com/deephaven/web-client-ui/commit/588cb8fd080ac992da40e9b732d82e206032c9eb))
- De-globalize utils, formatters, linker ([#1278](https://github.com/deephaven/web-client-ui/issues/1278)) ([cb0e9ba](https://github.com/deephaven/web-client-ui/commit/cb0e9ba432a096cdb61c76787cff66c09a337372))
- DH-14630 - ACL Editor Hooks ([#1257](https://github.com/deephaven/web-client-ui/issues/1257)) ([e0a2a36](https://github.com/deephaven/web-client-ui/commit/e0a2a369ea3c90e9c2e25b7e29823825db14d3f5)), closes [#1260](https://github.com/deephaven/web-client-ui/issues/1260)
- useTableUtils hook ([#1281](https://github.com/deephaven/web-client-ui/issues/1281)) ([ce1fe2c](https://github.com/deephaven/web-client-ui/commit/ce1fe2ce8cf28c4bc90356ebb25422835b5070df)), closes [#1280](https://github.com/deephaven/web-client-ui/issues/1280)

### BREAKING CHANGES

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

- `generateEmptyKeyedItemsRange` previously required a
  single `count` arg, but now requires a `start` and `end` index

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.37.1](https://github.com/deephaven/web-client-ui/compare/v0.37.0...v0.37.1) (2023-04-25)

### Bug Fixes

- Fixed dependency mapping ([#1247](https://github.com/deephaven/web-client-ui/issues/1247)) ([1e250a9](https://github.com/deephaven/web-client-ui/commit/1e250a9d096e03c77915495f277dabd717695319)), closes [#1246](https://github.com/deephaven/web-client-ui/issues/1246)

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- Added support for null in useTableListener ([#1227](https://github.com/deephaven/web-client-ui/issues/1227)) ([e485c86](https://github.com/deephaven/web-client-ui/commit/e485c868b6e82a0ff44a1e2682812a368d05eb7e)), closes [#1228](https://github.com/deephaven/web-client-ui/issues/1228)
- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)
- DH-14630 useViewportData + supporting utils ([#1230](https://github.com/deephaven/web-client-ui/issues/1230)) ([2f9c020](https://github.com/deephaven/web-client-ui/commit/2f9c020bfcb1ae508e219759e216a5ef7a63162d)), closes [#1221](https://github.com/deephaven/web-client-ui/issues/1221)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/jsapi-components

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/jsapi-components

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/jsapi-components
