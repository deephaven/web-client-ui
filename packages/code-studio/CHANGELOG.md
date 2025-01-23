# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

### Features

- Add global shortcut to export logs ([#2336](https://github.com/deephaven/web-client-ui/issues/2336)) ([6e813fd](https://github.com/deephaven/web-client-ui/commit/6e813fdc6837de9e85c0e139aaf0de9e02e452c2)), closes [#1963](https://github.com/deephaven/web-client-ui/issues/1963)

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/code-studio

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

**Note:** Version bump only for package @deephaven/code-studio

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

**Note:** Version bump only for package @deephaven/code-studio

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

**Note:** Version bump only for package @deephaven/code-studio

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/code-studio

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

### Bug Fixes

- Update react-spectrum packages ([#2303](https://github.com/deephaven/web-client-ui/issues/2303)) ([2216274](https://github.com/deephaven/web-client-ui/commit/2216274b416d9b1587a29c130dd19dd21accaa4b))

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

### Features

- Export Spectrum Toast from Components Package ([#2294](https://github.com/deephaven/web-client-ui/issues/2294)) ([a0961ad](https://github.com/deephaven/web-client-ui/commit/a0961ad161adf261c205642a3c3b9203b8892409))
- update version info pop-up with python/groovy version ([#2291](https://github.com/deephaven/web-client-ui/issues/2291)) ([a273b07](https://github.com/deephaven/web-client-ui/commit/a273b07228cbb82793e6762cbd9c65560bcd773c)), closes [#2184](https://github.com/deephaven/web-client-ui/issues/2184) [#2289](https://github.com/deephaven/web-client-ui/issues/2289)

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

### Features

- Ruff updates for DHE support ([#2280](https://github.com/deephaven/web-client-ui/issues/2280)) ([a35625e](https://github.com/deephaven/web-client-ui/commit/a35625efe3b918cd75d1dc07b02946398e2bca19))

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

**Note:** Version bump only for package @deephaven/code-studio

## [0.96.1](https://github.com/deephaven/web-client-ui/compare/v0.96.0...v0.96.1) (2024-10-11)

**Note:** Version bump only for package @deephaven/code-studio

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- checkbox_group re-export ([#2212](https://github.com/deephaven/web-client-ui/issues/2212)) ([a24dc8c](https://github.com/deephaven/web-client-ui/commit/a24dc8c447bc892aea2947641c32371d348042dc)), closes [#2211](https://github.com/deephaven/web-client-ui/issues/2211)
- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- Change ruff errors to warnings and fix config saving ([#2246](https://github.com/deephaven/web-client-ui/issues/2246)) ([6ae25a2](https://github.com/deephaven/web-client-ui/commit/6ae25a258ff4868d74e01040bbdf959bc7dd5586))
- Reuse dashboard tabs when reassigning the variable ([#2243](https://github.com/deephaven/web-client-ui/issues/2243)) ([d2c6eab](https://github.com/deephaven/web-client-ui/commit/d2c6eabb1fe313708fadd6676858466710159fda)), closes [#1971](https://github.com/deephaven/web-client-ui/issues/1971)

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

**Note:** Version bump only for package @deephaven/code-studio

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Features

- Make rollup group behaviour a setting in the global settings menu ([#2183](https://github.com/deephaven/web-client-ui/issues/2183)) ([bc8d5f2](https://github.com/deephaven/web-client-ui/commit/bc8d5f24ac7f883c0f9d65ba47901f83f996e95c)), closes [#2128](https://github.com/deephaven/web-client-ui/issues/2128)

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/code-studio

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/code-studio

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

**Note:** Version bump only for package @deephaven/code-studio

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Bug Fixes

- Restrict officially supported browserlist ([#2159](https://github.com/deephaven/web-client-ui/issues/2159)) ([5b06ecc](https://github.com/deephaven/web-client-ui/commit/5b06eccca1c2dff625bae34e3801940f19e7bb56)), closes [#1752](https://github.com/deephaven/web-client-ui/issues/1752)

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

### Features

- Adjustable grid density ([#2151](https://github.com/deephaven/web-client-ui/issues/2151)) ([6bb11f9](https://github.com/deephaven/web-client-ui/commit/6bb11f9a527310801041011be3be78cae07a8bc8)), closes [#885](https://github.com/deephaven/web-client-ui/issues/885)

## [0.86.1](https://github.com/deephaven/web-client-ui/compare/v0.86.0...v0.86.1) (2024-07-18)

**Note:** Version bump only for package @deephaven/code-studio

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

### Features

- Add option to disable WebGL rendering ([#2134](https://github.com/deephaven/web-client-ui/issues/2134)) ([011eb33](https://github.com/deephaven/web-client-ui/commit/011eb33b067412ffb6362237c9f6dc7256476bcd))
- Core plugins refactor, XComponent framework ([#2150](https://github.com/deephaven/web-client-ui/issues/2150)) ([2571fad](https://github.com/deephaven/web-client-ui/commit/2571faddee86d3c93e7814eb9034e606578ac040))

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/code-studio

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

**Note:** Version bump only for package @deephaven/code-studio

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/code-studio

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

**Note:** Version bump only for package @deephaven/code-studio

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
- ComboBoxNormalized - windowed data component ([#2072](https://github.com/deephaven/web-client-ui/issues/2072)) ([a30341a](https://github.com/deephaven/web-client-ui/commit/a30341a728625dc7fdc2b0a54b88dfc737977b7a)), closes [#2071](https://github.com/deephaven/web-client-ui/issues/2071)
- Embed widget loading workspace settings ([#2068](https://github.com/deephaven/web-client-ui/issues/2068)) ([b090f20](https://github.com/deephaven/web-client-ui/commit/b090f200b38a7ecab1056b17f445c2af3ae09a41)), closes [#1964](https://github.com/deephaven/web-client-ui/issues/1964)

### Bug Fixes

- Reconnect Auth Fail Fix - embed-widget ([#2023](https://github.com/deephaven/web-client-ui/issues/2023)) ([3e52242](https://github.com/deephaven/web-client-ui/commit/3e522428b88ed59cb9f8c38612a80236fd219e5d))

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

**Note:** Version bump only for package @deephaven/code-studio

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/code-studio

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/code-studio

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/code-studio

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/code-studio

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/code-studio

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))

### Features

- e2e combined improvements ([#1998](https://github.com/deephaven/web-client-ui/issues/1998)) ([99fc2f6](https://github.com/deephaven/web-client-ui/commit/99fc2f69758aa8b0289507b50c1ec52be0934d29))
- re-export Spectrum ButtonGroup ([#2028](https://github.com/deephaven/web-client-ui/issues/2028)) ([3115dd1](https://github.com/deephaven/web-client-ui/commit/3115dd1e0b2c13c5d2899529b0cbfd53d2bb823f)), closes [#2016](https://github.com/deephaven/web-client-ui/issues/2016)
- Replaced `RadioGroup` with Spectrum's ([#2020](https://github.com/deephaven/web-client-ui/issues/2020)) ([#2021](https://github.com/deephaven/web-client-ui/issues/2021)) ([c9ac72d](https://github.com/deephaven/web-client-ui/commit/c9ac72daddc4bc63012a675aa801af8ee807eff6))

### BREAKING CHANGES

- `RadioGroup` has been replaced by Spectrum
  `RadioGroup`. `RadioItem` has been replaced by Spectrum `Radio`
- Removed ButtonOld component, use Button instead.

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

### Features

- Add JS Plugin Information ([#2002](https://github.com/deephaven/web-client-ui/issues/2002)) ([6ff378c](https://github.com/deephaven/web-client-ui/commit/6ff378cf5c47382e5e7d48e086c5554c4ea4560f))
- ListView actions ([#1968](https://github.com/deephaven/web-client-ui/issues/1968)) ([8e325ec](https://github.com/deephaven/web-client-ui/commit/8e325ec30e68d612e8d696d0c6fec193a8c4ebdd))

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/code-studio

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

**Note:** Version bump only for package @deephaven/code-studio

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

**Note:** Version bump only for package @deephaven/code-studio

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Features

- Create an ErrorView that can be used to display errors ([#1965](https://github.com/deephaven/web-client-ui/issues/1965)) ([65ef1a7](https://github.com/deephaven/web-client-ui/commit/65ef1a79bb2b098e1d64046447794ba23b5a65c8))
- ListView + Picker - Item icon support ([#1959](https://github.com/deephaven/web-client-ui/issues/1959)) ([cb13c60](https://github.com/deephaven/web-client-ui/commit/cb13c6094f2f416e7682da67fde9fc05f68b9b17)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890)
- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

### Features

- Add DashboardPlugin support to embed-widget ([#1950](https://github.com/deephaven/web-client-ui/issues/1950)) ([27fc8bd](https://github.com/deephaven/web-client-ui/commit/27fc8bd49debf7b37fed9e91cbaf784c9ebb9347))
- replace code studio home icon with "Code Studio" as label ([#1951](https://github.com/deephaven/web-client-ui/issues/1951)) ([111ea64](https://github.com/deephaven/web-client-ui/commit/111ea64c675190995f85789ce57ea055b8b7fd2b)), closes [#1794](https://github.com/deephaven/web-client-ui/issues/1794)

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Features

- ListView components ([#1919](https://github.com/deephaven/web-client-ui/issues/1919)) ([b63ab18](https://github.com/deephaven/web-client-ui/commit/b63ab18033d1a8c218ad4cb7eccc252457c1d8d2))
- log export blacklist ([#1881](https://github.com/deephaven/web-client-ui/issues/1881)) ([d3fb28a](https://github.com/deephaven/web-client-ui/commit/d3fb28aeed55cdda005d5fa5dd3e4cb146faacdf)), closes [#1245](https://github.com/deephaven/web-client-ui/issues/1245)
- reopen closed tabs ([#1912](https://github.com/deephaven/web-client-ui/issues/1912)) ([c2e8714](https://github.com/deephaven/web-client-ui/commit/c2e8714c8728d414ec799277a68dc2675d330a11)), closes [#1785](https://github.com/deephaven/web-client-ui/issues/1785)

### BREAKING CHANGES

- `LIST_VIEW_ROW_HEIGHT` number constant replaced with
  dictionary `LIST_VIEW_ROW_HEIGHTS`

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

### Bug Fixes

- Add isInvalid prop to Select component ([#1883](https://github.com/deephaven/web-client-ui/issues/1883)) ([1803f31](https://github.com/deephaven/web-client-ui/commit/1803f31db3f0b5d2af2baf2931f47edb037c530e)), closes [#1882](https://github.com/deephaven/web-client-ui/issues/1882)

### Features

- wrap spectrum View, Text and Heading to accept custom colors ([#1903](https://github.com/deephaven/web-client-ui/issues/1903)) ([a03fa07](https://github.com/deephaven/web-client-ui/commit/a03fa0796e8a5a665d0badbd8380995567b0d6dc))

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Features

- Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

### chore

- Delete ValidateLabelInput ([#1887](https://github.com/deephaven/web-client-ui/issues/1887)) ([5d6ebe9](https://github.com/deephaven/web-client-ui/commit/5d6ebe92d91f39c1a2343721f5a4f53a6e02f3a5))

### BREAKING CHANGES

- ValidateLabelInput is no longer included in the
  `@deephaven/components` package.

## [0.69.1](https://github.com/deephaven/web-client-ui/compare/v0.69.0...v0.69.1) (2024-03-15)

### Bug Fixes

- Loading workspace plugin data ([#1872](https://github.com/deephaven/web-client-ui/issues/1872)) ([1def969](https://github.com/deephaven/web-client-ui/commit/1def969d81b4209df1e06cd99c0d5afc71d14844))

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

### Bug Fixes

- Save/load plugin data with layout ([#1866](https://github.com/deephaven/web-client-ui/issues/1866)) ([e64407d](https://github.com/deephaven/web-client-ui/commit/e64407d8e5c162bd3de07b84257a15e3330f415e)), closes [#1861](https://github.com/deephaven/web-client-ui/issues/1861)

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

### Features

- Added section support to Picker ([#1847](https://github.com/deephaven/web-client-ui/issues/1847)) ([1381ee7](https://github.com/deephaven/web-client-ui/commit/1381ee7f79ab493922a7fd3daa9d43ee6791547f))

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

### Bug Fixes

- Load default dashboard data from workspace data ([#1810](https://github.com/deephaven/web-client-ui/issues/1810)) ([6dd9814](https://github.com/deephaven/web-client-ui/commit/6dd9814d5dde7928c3ad765ce8a0e25f770c1871)), closes [#1746](https://github.com/deephaven/web-client-ui/issues/1746)

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Features

- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))
- Picker Component ([#1821](https://github.com/deephaven/web-client-ui/issues/1821)) ([e50f0f6](https://github.com/deephaven/web-client-ui/commit/e50f0f6c0402717f1bb8adb8a08a217a0f8d1f45))

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/code-studio

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

### Features

- Chart responsible for its own theme ([#1772](https://github.com/deephaven/web-client-ui/issues/1772)) ([fabb055](https://github.com/deephaven/web-client-ui/commit/fabb055f9dacdbb4ad1b4ce7ca85d170f955366d)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)
- toggle empty/null rendering ([#1778](https://github.com/deephaven/web-client-ui/issues/1778)) ([ae94f1b](https://github.com/deephaven/web-client-ui/commit/ae94f1beeaa9224264dc93231164401f89673ebc)), closes [#1646](https://github.com/deephaven/web-client-ui/issues/1646)

### BREAKING CHANGES

- - Renamed `ColorUtils.getColorwayFromTheme` to `normalizeColorway`

* Removed `chartTheme` arg from functions in `ChartUtils`,
  `ChartModelFactory` and `FigureChartModel` in @deephaven/chart

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))

### Features

- disable "Changes you made may not be saved." prompt in dev mode ([#1775](https://github.com/deephaven/web-client-ui/issues/1775)) ([6b0dce1](https://github.com/deephaven/web-client-ui/commit/6b0dce168df01df02219f64dbd6f9b73eec1fb2a))

### BREAKING CHANGES

- linker and iris grid custom cursor styling and assets
  are now provided by components directly. DHE css and svg files
  containing linker cursors should be removed/de-duplicated.

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

**Note:** Version bump only for package @deephaven/code-studio

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Bug Fixes

- missing react key on settings menu fragment ([#1757](https://github.com/deephaven/web-client-ui/issues/1757)) ([b14b714](https://github.com/deephaven/web-client-ui/commit/b14b714a7573ed4a3585b2e65334b57f9870b1ad))

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

- Handle undefined DashboardData props ([#1726](https://github.com/deephaven/web-client-ui/issues/1726)) ([45fa929](https://github.com/deephaven/web-client-ui/commit/45fa929586c0b13a738eceaa064b261eecbd8308)), closes [#1684](https://github.com/deephaven/web-client-ui/issues/1684) [#1685](https://github.com/deephaven/web-client-ui/issues/1685)

### Features

- added shortcut for copying version info and added browser/os to info ([#1739](https://github.com/deephaven/web-client-ui/issues/1739)) ([3312133](https://github.com/deephaven/web-client-ui/commit/3312133c902ed4a5ca110296ca36311fde9c1056))
- adjust display of theme palette in styleguide ([#1745](https://github.com/deephaven/web-client-ui/issues/1745)) ([0ab0c93](https://github.com/deephaven/web-client-ui/commit/0ab0c936baaee9effc08d4d9e8d6cc3ba60f9c97))
- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
- Default Plotly map colors ([#1721](https://github.com/deephaven/web-client-ui/issues/1721)) ([e8b9f12](https://github.com/deephaven/web-client-ui/commit/e8b9f121afaeb2c3dd6484a05ca1966a1d769260))
- Multiple dashboards ([#1714](https://github.com/deephaven/web-client-ui/issues/1714)) ([32dde3c](https://github.com/deephaven/web-client-ui/commit/32dde3c57765593889216cd3e27d1740ff357af1)), closes [#1683](https://github.com/deephaven/web-client-ui/issues/1683)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Features

- Improved preload variable handling ([#1723](https://github.com/deephaven/web-client-ui/issues/1723)) ([ed41c42](https://github.com/deephaven/web-client-ui/commit/ed41c424de75fcba8751a70b54a189957f979e97)), closes [#1695](https://github.com/deephaven/web-client-ui/issues/1695) [#1679](https://github.com/deephaven/web-client-ui/issues/1679)
- NavTabList component ([#1698](https://github.com/deephaven/web-client-ui/issues/1698)) ([96641fb](https://github.com/deephaven/web-client-ui/commit/96641fbc2f5f5ee291da15e464e80183d5107a57))
- theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Features

- Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

### Bug Fixes

- Bootstrap mixins ([#1692](https://github.com/deephaven/web-client-ui/issues/1692)) ([3934431](https://github.com/deephaven/web-client-ui/commit/3934431c0fbb440eff9017356d033394666cf7a1)), closes [#1693](https://github.com/deephaven/web-client-ui/issues/1693)

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

### Bug Fixes

- Made selector return types generic ([#1688](https://github.com/deephaven/web-client-ui/issues/1688)) ([b2972f0](https://github.com/deephaven/web-client-ui/commit/b2972f0dbf9e662eec6326acc6855aa1ddc85c41)), closes [#1687](https://github.com/deephaven/web-client-ui/issues/1687)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Bug Fixes

- add right margin to <Button kind='inline'/> using icons ([#1664](https://github.com/deephaven/web-client-ui/issues/1664)) ([fd8a6c6](https://github.com/deephaven/web-client-ui/commit/fd8a6c65d64b93ba69849b6053d5bbbd9d72c4dc))
- popper blur in styleguide ([#1672](https://github.com/deephaven/web-client-ui/issues/1672)) ([6fa2204](https://github.com/deephaven/web-client-ui/commit/6fa22046b0a327c8a1a6c5ab851cc064ae400bf8))

### Features

- Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
- theme fontawesome icon size wrapped in spectrum icons ([#1658](https://github.com/deephaven/web-client-ui/issues/1658)) ([2aa8cef](https://github.com/deephaven/web-client-ui/commit/2aa8cef6ce5a419b20c8a74d107bd523156d8ea4))
- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
- Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

### Bug Fixes

- Isolate Styleguide snapshots ([#1649](https://github.com/deephaven/web-client-ui/issues/1649)) ([a2ef056](https://github.com/deephaven/web-client-ui/commit/a2ef05681f348f02f46859909875e61c959a66dc))

### Features

- Styleguide regression tests ([#1639](https://github.com/deephaven/web-client-ui/issues/1639)) ([561ff22](https://github.com/deephaven/web-client-ui/commit/561ff22714a8b39cc55b41549712b5ef23bd39cf)), closes [#1634](https://github.com/deephaven/web-client-ui/issues/1634)

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Bug Fixes

- Date argument non-optional for the onChange prop ([#1622](https://github.com/deephaven/web-client-ui/issues/1622)) ([9a960b3](https://github.com/deephaven/web-client-ui/commit/9a960b3a50eed904fce61d3e97307261582a1de7)), closes [#1601](https://github.com/deephaven/web-client-ui/issues/1601)
- Fixing grid colors and grays ([#1621](https://github.com/deephaven/web-client-ui/issues/1621)) ([9ab2b1e](https://github.com/deephaven/web-client-ui/commit/9ab2b1e3204c7f854b8526e510b1e5a5fc59b8f6)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### Features

- Read settings from props/server config when available ([#1558](https://github.com/deephaven/web-client-ui/issues/1558)) ([52ba2cd](https://github.com/deephaven/web-client-ui/commit/52ba2cd125ff68f71c479d2d7c82f4b08d5b2ab6))
- Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### BREAKING CHANGES

- - ChartThemeProvider is now required to provide ChartTheme

* ChartModelFactory and ChartUtils now require chartTheme args

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Features

- Add support for multi-partition parquet:kv tables ([#1580](https://github.com/deephaven/web-client-ui/issues/1580)) ([d92c91e](https://github.com/deephaven/web-client-ui/commit/d92c91e8b47f412e333a92e4e6649557eea99707)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143) [#1438](https://github.com/deephaven/web-client-ui/issues/1438)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/code-studio

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- Remove @deephaven/app-utils from @deephaven/dashboard-core-plugins dependency list ([#1596](https://github.com/deephaven/web-client-ui/issues/1596)) ([7b59763](https://github.com/deephaven/web-client-ui/commit/7b59763d528a95eaca32e4c9607c50d447215798)), closes [#1593](https://github.com/deephaven/web-client-ui/issues/1593)

### Features

- Theming - Spectrum Provider ([#1582](https://github.com/deephaven/web-client-ui/issues/1582)) ([a4013c0](https://github.com/deephaven/web-client-ui/commit/a4013c0b83347197633a008b2b56006c8da12a46)), closes [#1543](https://github.com/deephaven/web-client-ui/issues/1543)
- Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))
- web-client-ui changes required for deephaven.ui ([#1567](https://github.com/deephaven/web-client-ui/issues/1567)) ([94ab25c](https://github.com/deephaven/web-client-ui/commit/94ab25cb16593f175ef4669a6845cdc22b847fc2))
- Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)

### BREAKING CHANGES

- - `usePlugins` and `PluginsContext` were moved from
    `@deephaven/app-utils` to `@deephaven/plugin`.

* `useLoadTablePlugin` was moved from `@deephaven/app-utils` to
  `@deephaven/dashboard-core-plugins`.
* `useConnection` and `ConnectionContext` were moved from
  `@deephaven/app-utils` to `@deephaven/jsapi-components`.
* `DeephavenPluginModuleMap` was removed from `@deephaven/redux`. Use
  `PluginModuleMap` from `@deephaven/plugin` instead.

- Enterprise will need ThemeProvider for the css
  variables to be available

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

### Bug Fixes

- Formatting Rule Doesn't use default set by user ([#1547](https://github.com/deephaven/web-client-ui/issues/1547)) ([ce51229](https://github.com/deephaven/web-client-ui/commit/ce51229231a9aae27871901412177e33dad24bea))
- Prompt for resetting layout ([#1552](https://github.com/deephaven/web-client-ui/issues/1552)) ([a273e64](https://github.com/deephaven/web-client-ui/commit/a273e6433a81f5500fb39992cac276bcbdbda753)), closes [#1250](https://github.com/deephaven/web-client-ui/issues/1250)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- data bar render from API ([#1415](https://github.com/deephaven/web-client-ui/issues/1415)) ([ee7d1c1](https://github.com/deephaven/web-client-ui/commit/ee7d1c108e86973b4c6855e482dce21d665dfe28)), closes [#0000](https://github.com/deephaven/web-client-ui/issues/0000) [#FF0000](https://github.com/deephaven/web-client-ui/issues/FF0000) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#FFFF00](https://github.com/deephaven/web-client-ui/issues/FFFF00) [#00FF00](https://github.com/deephaven/web-client-ui/issues/00FF00)
- Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)
- Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)

### BREAKING CHANGES

- Theme variables have to be present on body to avoid
  Monaco init failing
- Inline LoadingSpinner instances will need to be
  decorated with `className="loading-spinner-vertical-align"` for vertical
  alignment to work as before

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

**Note:** Version bump only for package @deephaven/code-studio

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

### Code Refactoring

- Improve table saver to always use the correct service worker ([#1515](https://github.com/deephaven/web-client-ui/issues/1515)) ([2488e52](https://github.com/deephaven/web-client-ui/commit/2488e52fdeda16604be2516c30782d6127be9317)), closes [#766](https://github.com/deephaven/web-client-ui/issues/766)

### BREAKING CHANGES

- `TableSaver` now expects the service worker to send it
  a complete URL for download instead of just a file name. DHE will need
  to adjust its `serviceWorker.js` to incorporate the same changes from
  this PR.

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/code-studio

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Features

- adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)
- Consolidate and normalize plugin types ([#1456](https://github.com/deephaven/web-client-ui/issues/1456)) ([43a782d](https://github.com/deephaven/web-client-ui/commit/43a782dd3ebf582b18e155fdbc313176b0bf0f84)), closes [#1454](https://github.com/deephaven/web-client-ui/issues/1454) [#1451](https://github.com/deephaven/web-client-ui/issues/1451)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- legal notices dismisses on click anywhere ([#1452](https://github.com/deephaven/web-client-ui/issues/1452)) ([a189375](https://github.com/deephaven/web-client-ui/commit/a18937562f6e9ce2d62b27f79a60adc341a435e9))
- Zip CSV uploads not working ([#1457](https://github.com/deephaven/web-client-ui/issues/1457)) ([08d0296](https://github.com/deephaven/web-client-ui/commit/08d0296fee6a695c8312dec7d3bed648f10c7acb)), closes [#1080](https://github.com/deephaven/web-client-ui/issues/1080) [#1416](https://github.com/deephaven/web-client-ui/issues/1416)

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

### Bug Fixes

- Environment variable replacement in styleguide ([#1443](https://github.com/deephaven/web-client-ui/issues/1443)) ([9fd5c27](https://github.com/deephaven/web-client-ui/commit/9fd5c27df9af4c6e63117e07f90c2fdc3029dfe1))
- Upgrade Monaco to ^0.41.0 ([#1448](https://github.com/deephaven/web-client-ui/issues/1448)) ([1120c2b](https://github.com/deephaven/web-client-ui/commit/1120c2b235d2ca2c8b14c818ccfc2847294c3811)), closes [#1445](https://github.com/deephaven/web-client-ui/issues/1445) [#1191](https://github.com/deephaven/web-client-ui/issues/1191)

### Build System

- **@deephaven/icons:** Properly package icons and remove unnecessary files in dist ([#1437](https://github.com/deephaven/web-client-ui/issues/1437)) ([ec7ccef](https://github.com/deephaven/web-client-ui/commit/ec7ccefc8c65ce6ea01622d509d4c654324fa401))

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

* **@deephaven/icons:** Any imports/aliasing to `@deephaven/icons/dist` should
  be removed and just read the package contents normally (e.g. DHE jest
  and vite configs for using community packages locally). See the changes
  to vite and jest configs in this change for how to update

## [0.45.1](https://github.com/deephaven/web-client-ui/compare/v0.45.0...v0.45.1) (2023-08-01)

**Note:** Version bump only for package @deephaven/code-studio

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/code-studio

## [0.44.1](https://github.com/deephaven/web-client-ui/compare/v0.44.0...v0.44.1) (2023-07-11)

**Note:** Version bump only for package @deephaven/code-studio

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Bug Fixes

- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Bug Fixes

- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Reverts

- adding back "Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1365](https://github.com/deephaven/web-client-ui/issues/1365)) ([8586d4d](https://github.com/deephaven/web-client-ui/commit/8586d4d99e55def1747eb820e824b61703990e58))

## [0.41.1](https://github.com/deephaven/web-client-ui/compare/v0.41.0...v0.41.1) (2023-06-08)

### Bug Fixes

- Cannot add control from Controls menu with click ([#1363](https://github.com/deephaven/web-client-ui/issues/1363)) ([65c0925](https://github.com/deephaven/web-client-ui/commit/65c09253608f7c8c887ca4e70cc5632e81673301)), closes [#1362](https://github.com/deephaven/web-client-ui/issues/1362)

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
