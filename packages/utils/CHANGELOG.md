# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

**Note:** Version bump only for package @deephaven/utils

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/utils

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/utils

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/utils

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/utils

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/utils

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

**Note:** Version bump only for package @deephaven/utils

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### Features

- Branded type utils ([#2264](https://github.com/deephaven/web-client-ui/issues/2264)) ([fff0155](https://github.com/deephaven/web-client-ui/commit/fff0155f2e7b431faca755e028e7dbe3123dac63)), closes [#2263](https://github.com/deephaven/web-client-ui/issues/2263)

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

**Note:** Version bump only for package @deephaven/utils

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

**Note:** Version bump only for package @deephaven/utils

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

**Note:** Version bump only for package @deephaven/utils

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/utils

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/utils

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

**Note:** Version bump only for package @deephaven/utils

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

**Note:** Version bump only for package @deephaven/utils

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

### ⚠ BREAKING CHANGES

- Fix any try / catch blocks that return non-awaited
  Promises

### Bug Fixes

- Enabled @typescript-eslint/return-await rule and fixed offending code ([#2157](https://github.com/deephaven/web-client-ui/issues/2157)) ([7875d03](https://github.com/deephaven/web-client-ui/commit/7875d03fdbe2dfa1c051c6dfa42cc1d9e7469afb)), closes [#2154](https://github.com/deephaven/web-client-ui/issues/2154)

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

**Note:** Version bump only for package @deephaven/utils

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/utils

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/utils

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

**Note:** Version bump only for package @deephaven/utils

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/utils

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/utils

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

**Note:** Version bump only for package @deephaven/utils

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

**Note:** Version bump only for package @deephaven/utils

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/utils

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

**Note:** Version bump only for package @deephaven/utils

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Features

- ListView + Picker - Item icon support ([#1959](https://github.com/deephaven/web-client-ui/issues/1959)) ([cb13c60](https://github.com/deephaven/web-client-ui/commit/cb13c6094f2f416e7682da67fde9fc05f68b9b17)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890)
- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/utils

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

**Note:** Version bump only for package @deephaven/utils

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/utils

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/utils

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

**Note:** Version bump only for package @deephaven/utils

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Features

- Test Utils - Generate exhaustive boolean combinations and MockProxy spread ([#1811](https://github.com/deephaven/web-client-ui/issues/1811)) ([0a2f054](https://github.com/deephaven/web-client-ui/commit/0a2f054591d04dd32c4919ce90fd538638e0b563)), closes [#1809](https://github.com/deephaven/web-client-ui/issues/1809)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/utils

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Features

- multiselect values ([#1736](https://github.com/deephaven/web-client-ui/issues/1736)) ([e6955c1](https://github.com/deephaven/web-client-ui/commit/e6955c1b330ae09d3bfbe3bbcb6d1bf303ea9b48)), closes [#1233](https://github.com/deephaven/web-client-ui/issues/1233)

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/utils

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

**Note:** Version bump only for package @deephaven/utils

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

**Note:** Version bump only for package @deephaven/utils

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

**Note:** Version bump only for package @deephaven/utils

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

### Bug Fixes

- Made selector return types generic ([#1688](https://github.com/deephaven/web-client-ui/issues/1688)) ([b2972f0](https://github.com/deephaven/web-client-ui/commit/b2972f0dbf9e662eec6326acc6855aa1ddc85c41)), closes [#1687](https://github.com/deephaven/web-client-ui/issues/1687)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Features

- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/utils

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Bug Fixes

- Infinite loop with grid rendering ([#1631](https://github.com/deephaven/web-client-ui/issues/1631)) ([4875d2e](https://github.com/deephaven/web-client-ui/commit/4875d2e1e895478720950ad73f28d1b895114a58)), closes [#1626](https://github.com/deephaven/web-client-ui/issues/1626)

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/utils

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/utils

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Features

- Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))

### BREAKING CHANGES

- Enterprise will need ThemeProvider for the css
  variables to be available

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)
- Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)

### BREAKING CHANGES

- Theme variables have to be present on body to avoid
  Monaco init failing
- Inline LoadingSpinner instances will need to be
  decorated with `className="loading-spinner-vertical-align"` for vertical
  alignment to work as before

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/utils

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/utils

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Features

- bindAllMethods util function ([#1476](https://github.com/deephaven/web-client-ui/issues/1476)) ([0dab8d7](https://github.com/deephaven/web-client-ui/commit/0dab8d70f299441271fe7047f9d4f2eb48a6d8be)), closes [#1474](https://github.com/deephaven/web-client-ui/issues/1474)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/utils

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/utils

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Bug Fixes

- export TypeUtils ([#1395](https://github.com/deephaven/web-client-ui/issues/1395)) ([c76730f](https://github.com/deephaven/web-client-ui/commit/c76730f5a6f8a973b3e51bb7c7da5e79891ac86c))
- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

### Features

- "Extends" TypeScript util type ([#1394](https://github.com/deephaven/web-client-ui/issues/1394)) ([7cb073f](https://github.com/deephaven/web-client-ui/commit/7cb073f8897a0a03e2f86c65f94faccc46fded35)), closes [#1393](https://github.com/deephaven/web-client-ui/issues/1393)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Bug Fixes

- export TypeUtils ([#1395](https://github.com/deephaven/web-client-ui/issues/1395)) ([c76730f](https://github.com/deephaven/web-client-ui/commit/c76730f5a6f8a973b3e51bb7c7da5e79891ac86c))
- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

### Features

- "Extends" TypeScript util type ([#1394](https://github.com/deephaven/web-client-ui/issues/1394)) ([7cb073f](https://github.com/deephaven/web-client-ui/commit/7cb073f8897a0a03e2f86c65f94faccc46fded35)), closes [#1393](https://github.com/deephaven/web-client-ui/issues/1393)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Features

- Console output test util ([#1370](https://github.com/deephaven/web-client-ui/issues/1370)) ([626de83](https://github.com/deephaven/web-client-ui/commit/626de830ba4f580c90b0d0e2ee51ce8fd0452ad9)), closes [#1369](https://github.com/deephaven/web-client-ui/issues/1369)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/utils

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

### Bug Fixes

- makeApiContextWrapper and createMockProxy ([#1312](https://github.com/deephaven/web-client-ui/issues/1312)) ([d389963](https://github.com/deephaven/web-client-ui/commit/d3899631c329e4a34f397158c4aae5da4f2f3084)), closes [#1311](https://github.com/deephaven/web-client-ui/issues/1311)

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

**Note:** Version bump only for package @deephaven/utils

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- DH-14630 - ACL Editor Hooks ([#1257](https://github.com/deephaven/web-client-ui/issues/1257)) ([e0a2a36](https://github.com/deephaven/web-client-ui/commit/e0a2a369ea3c90e9c2e25b7e29823825db14d3f5)), closes [#1260](https://github.com/deephaven/web-client-ui/issues/1260)

### BREAKING CHANGES

- `generateEmptyKeyedItemsRange` previously required a
  single `count` arg, but now requires a `start` and `end` index

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/utils

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- DH-14630 useViewportData + supporting utils ([#1230](https://github.com/deephaven/web-client-ui/issues/1230)) ([2f9c020](https://github.com/deephaven/web-client-ui/commit/2f9c020bfcb1ae508e219759e216a5ef7a63162d)), closes [#1221](https://github.com/deephaven/web-client-ui/issues/1221)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/utils

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

### Features

- Created ValueOf<T> util type ([#1203](https://github.com/deephaven/web-client-ui/issues/1203)) ([19fcf0e](https://github.com/deephaven/web-client-ui/commit/19fcf0e7efa9290bf4aa072b3dd8a2826f16cc75)), closes [#1202](https://github.com/deephaven/web-client-ui/issues/1202)

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

**Note:** Version bump only for package @deephaven/utils

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Added smarter caching for command history fetching ([#1145](https://github.com/deephaven/web-client-ui/issues/1145)) ([76b3bd5](https://github.com/deephaven/web-client-ui/commit/76b3bd51059638d5b864fabe8b4121b6a3554f17)), closes [#325](https://github.com/deephaven/web-client-ui/issues/325)

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

### Features

- Add support for clickable links ([#1088](https://github.com/deephaven/web-client-ui/issues/1088)) ([f7f918e](https://github.com/deephaven/web-client-ui/commit/f7f918e7f0c5f1b0fb4030eb748010aaf4d196df)), closes [#712](https://github.com/deephaven/web-client-ui/issues/712)

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

**Note:** Version bump only for package @deephaven/utils

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

**Note:** Version bump only for package @deephaven/utils

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/utils
