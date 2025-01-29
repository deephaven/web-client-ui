# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

### Features

- Add global shortcut to export logs ([#2336](https://github.com/deephaven/web-client-ui/issues/2336)) ([6e813fd](https://github.com/deephaven/web-client-ui/commit/6e813fdc6837de9e85c0e139aaf0de9e02e452c2)), closes [#1963](https://github.com/deephaven/web-client-ui/issues/1963)

### Bug Fixes

- Ensure ErrorBoundary and PanelErrorBoundary do not throw ([#2345](https://github.com/deephaven/web-client-ui/issues/2345)) ([675b110](https://github.com/deephaven/web-client-ui/commit/675b1106cb9b67d898857dd427fb437d2cb9d1ad))

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

### Bug Fixes

- Update Spectrum Theme for Missing ContextualHelpTrigger Icon ([#2330](https://github.com/deephaven/web-client-ui/issues/2330)) ([5f6c8d6](https://github.com/deephaven/web-client-ui/commit/5f6c8d6a30099ac33fc6e35536b2ddfa9df528ca))

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

### Bug Fixes

- ComboBox show all items on open ([#2328](https://github.com/deephaven/web-client-ui/issues/2328)) ([c08bb7b](https://github.com/deephaven/web-client-ui/commit/c08bb7bacd579bd868ad2c2874cf9db0c5404e66))

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

### Bug Fixes

- accordion, disclosure, color picker, color editor export ([#2325](https://github.com/deephaven/web-client-ui/issues/2325)) ([b6e4eb2](https://github.com/deephaven/web-client-ui/commit/b6e4eb2428cff547f962cfe16957b2c4bda23527))

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

### Features

- Export Spectrum Menu and SubmenuTrigger ([#2322](https://github.com/deephaven/web-client-ui/issues/2322)) ([d4eab8a](https://github.com/deephaven/web-client-ui/commit/d4eab8addec36b866991c158b5a045f788ccd6ef))

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/components

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

### Bug Fixes

- Update react-spectrum packages ([#2303](https://github.com/deephaven/web-client-ui/issues/2303)) ([2216274](https://github.com/deephaven/web-client-ui/commit/2216274b416d9b1587a29c130dd19dd21accaa4b))

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

### Features

- Export Spectrum Toast from Components Package ([#2294](https://github.com/deephaven/web-client-ui/issues/2294)) ([a0961ad](https://github.com/deephaven/web-client-ui/commit/a0961ad161adf261c205642a3c3b9203b8892409))

### Bug Fixes

- missing search field import ([#2292](https://github.com/deephaven/web-client-ui/issues/2292)) ([cb1f11f](https://github.com/deephaven/web-client-ui/commit/cb1f11f43cc753fb5eb825f7a524f4285e3d1400)), closes [#2287](https://github.com/deephaven/web-client-ui/issues/2287)

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

### Bug Fixes

- --dh-color-overlay-modal-bg theme background color to be black not gray ([#2277](https://github.com/deephaven/web-client-ui/issues/2277)) ([aba019a](https://github.com/deephaven/web-client-ui/commit/aba019af902d74a3c8c558c0549b535b985234a4)), closes [#2276](https://github.com/deephaven/web-client-ui/issues/2276)

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### Bug Fixes

- Fix Type in Spectrum Modal Overlay Background Color ([#2267](https://github.com/deephaven/web-client-ui/issues/2267)) ([9d84d8d](https://github.com/deephaven/web-client-ui/commit/9d84d8df388031f73aea16cefece9b0bea2790a4))

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- checkbox_group re-export ([#2212](https://github.com/deephaven/web-client-ui/issues/2212)) ([a24dc8c](https://github.com/deephaven/web-client-ui/commit/a24dc8c447bc892aea2947641c32371d348042dc)), closes [#2211](https://github.com/deephaven/web-client-ui/issues/2211)
- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- improve color contrast of editor find in dark mode ([#2248](https://github.com/deephaven/web-client-ui/issues/2248)) ([f8dd133](https://github.com/deephaven/web-client-ui/commit/f8dd1332b2027f93c5b9cbb174f79261298d0ea5))

## [0.95.0](https://github.com/deephaven/web-client-ui/compare/v0.94.0...v0.95.0) (2024-09-20)

### ⚠ BREAKING CHANGES

- eslint rule will require type only imports where
  possible

### Bug Fixes

- Widget panel fixes ([#2227](https://github.com/deephaven/web-client-ui/issues/2227)) ([c985e12](https://github.com/deephaven/web-client-ui/commit/c985e1274097860dcbf4690ac8412c9f84831209))

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

### Features

- Add clickOutside prop to Modal ([#2214](https://github.com/deephaven/web-client-ui/issues/2214)) ([d78ad6d](https://github.com/deephaven/web-client-ui/commit/d78ad6d0e883a4c4c76078ae8b09c611fab35ae9))

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Features

- Set selected theme via query string param ([#2204](https://github.com/deephaven/web-client-ui/issues/2204)) ([89ede66](https://github.com/deephaven/web-client-ui/commit/89ede667c56746b3ff17cc7ecb6d9153aa6c2edc)), closes [#2203](https://github.com/deephaven/web-client-ui/issues/2203)

### Bug Fixes

- Invalid import in @deephaven/components for webpack ([#2200](https://github.com/deephaven/web-client-ui/issues/2200)) ([dcc95f6](https://github.com/deephaven/web-client-ui/commit/dcc95f69ff3a94a0558093ed699f8147096b2556)), closes [#2192](https://github.com/deephaven/web-client-ui/issues/2192)

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

### Features

- Deephaven UI table databar support ([#2190](https://github.com/deephaven/web-client-ui/issues/2190)) ([b5ce598](https://github.com/deephaven/web-client-ui/commit/b5ce598478797125371ae0952ab6e84aca07efba))

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/components

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

### Features

- Refactor console objects menu ([#2013](https://github.com/deephaven/web-client-ui/issues/2013)) ([8251180](https://github.com/deephaven/web-client-ui/commit/825118048326d3622aec2e4b851d81e8b7d93e35)), closes [#1884](https://github.com/deephaven/web-client-ui/issues/1884)

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Features

- Allow ref callback for Chart and ChartPanel ([#2174](https://github.com/deephaven/web-client-ui/issues/2174)) ([56d1fa9](https://github.com/deephaven/web-client-ui/commit/56d1fa9ba00d319794d686365be245c757ad2178))
- Export Internationalized Date Types for DatePicker ([#2170](https://github.com/deephaven/web-client-ui/issues/2170)) ([7fb4f64](https://github.com/deephaven/web-client-ui/commit/7fb4f64bf9822c95faa961c53f480da4ea9e0401))

### Bug Fixes

- DH-17454: Combine modal classes instead of replacing ([#2173](https://github.com/deephaven/web-client-ui/issues/2173)) ([a2d5d5f](https://github.com/deephaven/web-client-ui/commit/a2d5d5f9a63ab2d7ec37b95c716f4bf1ae03b9b8))
- DH-17454: Wrap Modal in SpectrumThemeProvider ([#2169](https://github.com/deephaven/web-client-ui/issues/2169)) ([0058b18](https://github.com/deephaven/web-client-ui/commit/0058b1801c1bfb21e3961a31a8a1c7a27443abb4))

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

**Note:** Version bump only for package @deephaven/components

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

### Features

- Add option to disable WebGL rendering ([#2134](https://github.com/deephaven/web-client-ui/issues/2134)) ([011eb33](https://github.com/deephaven/web-client-ui/commit/011eb33b067412ffb6362237c9f6dc7256476bcd))
- Core plugins refactor, XComponent framework ([#2150](https://github.com/deephaven/web-client-ui/issues/2150)) ([2571fad](https://github.com/deephaven/web-client-ui/commit/2571faddee86d3c93e7814eb9034e606578ac040))

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

### Bug Fixes

- Fix missing scrim background on LoadingOverlay ([#2098](https://github.com/deephaven/web-client-ui/issues/2098)) ([c9ed895](https://github.com/deephaven/web-client-ui/commit/c9ed895b103ba89b459e413141d38a1f7512dfff))

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

### Bug Fixes

- re-export remaining types needed by dh ui from @react-types/shared ([#2132](https://github.com/deephaven/web-client-ui/issues/2132)) ([2119a61](https://github.com/deephaven/web-client-ui/commit/2119a61805fd895adc6b95d53bffb598460c0746))

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

### Features

- ComboBox - @deephaven/jsapi-components ([#2077](https://github.com/deephaven/web-client-ui/issues/2077)) ([115e057](https://github.com/deephaven/web-client-ui/commit/115e057114257a186c4a9a006a1958e03b7470c5)), closes [#2074](https://github.com/deephaven/web-client-ui/issues/2074)

### Bug Fixes

- Allow ComboBox to accept the FocusableRef for ref ([#2121](https://github.com/deephaven/web-client-ui/issues/2121)) ([8fe9bad](https://github.com/deephaven/web-client-ui/commit/8fe9bad7889f0fce49ad50415a7cb59d7623a43c))
- Ref was not being passed through for Picker ([#2122](https://github.com/deephaven/web-client-ui/issues/2122)) ([a11e2ce](https://github.com/deephaven/web-client-ui/commit/a11e2ceaf216d640068562a05fdb156c69481d47))

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

### Bug Fixes

- make textValue default to key for Normalized Item ([#2113](https://github.com/deephaven/web-client-ui/issues/2113)) ([bd3e944](https://github.com/deephaven/web-client-ui/commit/bd3e944a53fe577fb48a3c8720c8b9c3881a5a04))

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

### Bug Fixes

- view border styling ([#2063](https://github.com/deephaven/web-client-ui/issues/2063)) ([6f99e6b](https://github.com/deephaven/web-client-ui/commit/6f99e6b764a63e31aec36d435ec62926d109955e))

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

### Bug Fixes

- A few small cleanups for DateTimeInput ([#2062](https://github.com/deephaven/web-client-ui/issues/2062)) ([ec11736](https://github.com/deephaven/web-client-ui/commit/ec117365f17ac6c4635c5b73c28c9cc8bee10d84))

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/components

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

### Bug Fixes

- Exporting correct Radio prop types ([#2058](https://github.com/deephaven/web-client-ui/issues/2058)) ([98be05a](https://github.com/deephaven/web-client-ui/commit/98be05aa0897ac479ff13d26e7902f129ac9a749)), closes [40react-types/radio/src/index.d.ts#L58-L71](https://github.com/40react-types/radio/src/index.d.ts/issues/L58-L71) [#2020](https://github.com/deephaven/web-client-ui/issues/2020)

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/components

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

### Bug Fixes

- re-export Radio and RadioGroup prop types ([#2055](https://github.com/deephaven/web-client-ui/issues/2055)) ([06b9767](https://github.com/deephaven/web-client-ui/commit/06b976752d756db17a491645cebe79a7293ce132)), closes [#2020](https://github.com/deephaven/web-client-ui/issues/2020)

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

### Features

- Re-export Spectrum button and checkbox ([#2039](https://github.com/deephaven/web-client-ui/issues/2039)) ([0e22d11](https://github.com/deephaven/web-client-ui/commit/0e22d11a6da3f189530b2ce0c8751d44097db971))

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

### Bug Fixes

- Improve the look of the error view ([#2001](https://github.com/deephaven/web-client-ui/issues/2001)) ([3236c9b](https://github.com/deephaven/web-client-ui/commit/3236c9b7acb53e9468f09c1e57a99d79bb953774))

### Code Refactoring

- Rename `ButtonGroup` to `SplitButtonGroup` ([#1997](https://github.com/deephaven/web-client-ui/issues/1997)) ([95a589c](https://github.com/deephaven/web-client-ui/commit/95a589ca4b471e2c357e8fcaf6c9e1f4581a5231))

### Features

- add middle click dashboard tab deletion ([#1992](https://github.com/deephaven/web-client-ui/issues/1992)) ([c922f87](https://github.com/deephaven/web-client-ui/commit/c922f87941858466e90802f4171104129284037b)), closes [#1990](https://github.com/deephaven/web-client-ui/issues/1990)
- ListView actions ([#1968](https://github.com/deephaven/web-client-ui/issues/1968)) ([8e325ec](https://github.com/deephaven/web-client-ui/commit/8e325ec30e68d612e8d696d0c6fec193a8c4ebdd))

### BREAKING CHANGES

- Renamed @deephaven/components `ButtonGroup` to
  `SplitButtonGroup`

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/components

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

### Bug Fixes

- Fixed ListView props ([#1986](https://github.com/deephaven/web-client-ui/issues/1986)) ([0ca3a66](https://github.com/deephaven/web-client-ui/commit/0ca3a66bb090d4ce3a7e05bf53154eb86b367e8d))

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

**Note:** Version bump only for package @deephaven/components

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Features

- Create an ErrorView that can be used to display errors ([#1965](https://github.com/deephaven/web-client-ui/issues/1965)) ([65ef1a7](https://github.com/deephaven/web-client-ui/commit/65ef1a79bb2b098e1d64046447794ba23b5a65c8))
- ListView + Picker - Item icon support ([#1959](https://github.com/deephaven/web-client-ui/issues/1959)) ([cb13c60](https://github.com/deephaven/web-client-ui/commit/cb13c6094f2f416e7682da67fde9fc05f68b9b17)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890)
- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

### Bug Fixes

- unable to select deselected leaf ([#1956](https://github.com/deephaven/web-client-ui/issues/1956)) ([f5d622a](https://github.com/deephaven/web-client-ui/commit/f5d622a2170f30cb30eecf2bbdac97b23c1f8058)), closes [#1856](https://github.com/deephaven/web-client-ui/issues/1856)

### Features

- replace code studio home icon with "Code Studio" as label ([#1951](https://github.com/deephaven/web-client-ui/issues/1951)) ([111ea64](https://github.com/deephaven/web-client-ui/commit/111ea64c675190995f85789ce57ea055b8b7fd2b)), closes [#1794](https://github.com/deephaven/web-client-ui/issues/1794)

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Features

- ListView components ([#1919](https://github.com/deephaven/web-client-ui/issues/1919)) ([b63ab18](https://github.com/deephaven/web-client-ui/commit/b63ab18033d1a8c218ad4cb7eccc252457c1d8d2))
- reopen closed tabs ([#1912](https://github.com/deephaven/web-client-ui/issues/1912)) ([c2e8714](https://github.com/deephaven/web-client-ui/commit/c2e8714c8728d414ec799277a68dc2675d330a11)), closes [#1785](https://github.com/deephaven/web-client-ui/issues/1785)

### BREAKING CHANGES

- `LIST_VIEW_ROW_HEIGHT` number constant replaced with
  dictionary `LIST_VIEW_ROW_HEIGHTS`

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

### Bug Fixes

- Add isInvalid prop to Select component ([#1883](https://github.com/deephaven/web-client-ui/issues/1883)) ([1803f31](https://github.com/deephaven/web-client-ui/commit/1803f31db3f0b5d2af2baf2931f47edb037c530e)), closes [#1882](https://github.com/deephaven/web-client-ui/issues/1882)
- adjust alignment of search input next/previous buttons ([#1917](https://github.com/deephaven/web-client-ui/issues/1917)) ([c7fcd38](https://github.com/deephaven/web-client-ui/commit/c7fcd38d41d27d7ff3cc32222b16b44412611b71))

### Features

- re-export spectrum useStyleProp util ([#1916](https://github.com/deephaven/web-client-ui/issues/1916)) ([aafa14b](https://github.com/deephaven/web-client-ui/commit/aafa14b12e273c82f0df69d8d7b322c7fc8bff6c))
- wrap spectrum View, Text and Heading to accept custom colors ([#1903](https://github.com/deephaven/web-client-ui/issues/1903)) ([a03fa07](https://github.com/deephaven/web-client-ui/commit/a03fa0796e8a5a665d0badbd8380995567b0d6dc))

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Bug Fixes

- Fixed re-export ([#1894](https://github.com/deephaven/web-client-ui/issues/1894)) ([#1895](https://github.com/deephaven/web-client-ui/issues/1895)) ([b49b506](https://github.com/deephaven/web-client-ui/commit/b49b5069d637ac136578ce839d9fc0416f468adf))

### Features

- Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

### chore

- Delete ValidateLabelInput ([#1887](https://github.com/deephaven/web-client-ui/issues/1887)) ([5d6ebe9](https://github.com/deephaven/web-client-ui/commit/5d6ebe92d91f39c1a2343721f5a4f53a6e02f3a5))

### Features

- Re-export Spectrum components + prop types ([#1880](https://github.com/deephaven/web-client-ui/issues/1880)) ([4783092](https://github.com/deephaven/web-client-ui/commit/478309289f727c560ae92722c96fed964ba98d9d)), closes [#1852](https://github.com/deephaven/web-client-ui/issues/1852)

### BREAKING CHANGES

- ValidateLabelInput is no longer included in the
  `@deephaven/components` package.

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

### Features

- expose spectrum `Flex` component as wrapped deephaven component ([#1869](https://github.com/deephaven/web-client-ui/issues/1869)) ([5e71488](https://github.com/deephaven/web-client-ui/commit/5e71488d142b4d2b427bc0b81d17a0f538b09c26))

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Features

- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

### Features

- Added section support to Picker ([#1847](https://github.com/deephaven/web-client-ui/issues/1847)) ([1381ee7](https://github.com/deephaven/web-client-ui/commit/1381ee7f79ab493922a7fd3daa9d43ee6791547f))

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

### Bug Fixes

- Spectrum actionbar selector ([#1841](https://github.com/deephaven/web-client-ui/issues/1841)) ([67de0e0](https://github.com/deephaven/web-client-ui/commit/67de0e09d11ba340aa546be71c400852a5a2092c))

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Bug Fixes

- spectrum textfield validation icon position with set content-box ([#1825](https://github.com/deephaven/web-client-ui/issues/1825)) ([8d95212](https://github.com/deephaven/web-client-ui/commit/8d952125009ddc4e4039833be4a80404d82ed7d7))

### Features

- exposes editor-line-number-active-fg theme variable ([#1833](https://github.com/deephaven/web-client-ui/issues/1833)) ([448f0f0](https://github.com/deephaven/web-client-ui/commit/448f0f0d5bf99be14845e3f6b0e063f55a8de775))
- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))
- Picker Component ([#1821](https://github.com/deephaven/web-client-ui/issues/1821)) ([e50f0f6](https://github.com/deephaven/web-client-ui/commit/e50f0f6c0402717f1bb8adb8a08a217a0f8d1f45))

### BREAKING CHANGES

- the duplicate `spectrum-Textfield-validationIcon` css
  in DHE should be removed

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

**Note:** Version bump only for package @deephaven/components

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

### Bug Fixes

- address chrome 121 scrollbar style behaviour change ([#1787](https://github.com/deephaven/web-client-ui/issues/1787)) ([fa3a33d](https://github.com/deephaven/web-client-ui/commit/fa3a33d18ccf0b3c011088b77ffb625237aa6836))

### Features

- Chart responsible for its own theme ([#1772](https://github.com/deephaven/web-client-ui/issues/1772)) ([fabb055](https://github.com/deephaven/web-client-ui/commit/fabb055f9dacdbb4ad1b4ce7ca85d170f955366d)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)

### BREAKING CHANGES

- - Renamed `ColorUtils.getColorwayFromTheme` to `normalizeColorway`

* Removed `chartTheme` arg from functions in `ChartUtils`,
  `ChartModelFactory` and `FigureChartModel` in @deephaven/chart

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- adjust theme notice and info colors ([#1779](https://github.com/deephaven/web-client-ui/issues/1779)) ([8930522](https://github.com/deephaven/web-client-ui/commit/893052295861cfca13e445abe61b3ac4aa55af61))
- DH-16461: Preload --dh-color-text-highlight ([#1780](https://github.com/deephaven/web-client-ui/issues/1780)) ([#1781](https://github.com/deephaven/web-client-ui/issues/1781)) ([f7989b6](https://github.com/deephaven/web-client-ui/commit/f7989b6054e5301276f5b94e5ee1e8f5f73ca6a1))
- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))

### BREAKING CHANGES

- linker and iris grid custom cursor styling and assets
  are now provided by components directly. DHE css and svg files
  containing linker cursors should be removed/de-duplicated.

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/components

## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

### Bug Fixes

- apply theme accent color scale and other small tweaks ([#1768](https://github.com/deephaven/web-client-ui/issues/1768)) ([1e631a4](https://github.com/deephaven/web-client-ui/commit/1e631a470bff851f8c0d4401a43bc08d0c974391))

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Features

- allow themes to use any srgb color for definitions ([#1756](https://github.com/deephaven/web-client-ui/issues/1756)) ([b047fa3](https://github.com/deephaven/web-client-ui/commit/b047fa36de3a285be925736ef73722a60d1d9ed7))
- DH-16336: usePickerWithSelectedValues - boolean flags should be calculated based on trimmed search text ([#1750](https://github.com/deephaven/web-client-ui/issues/1750)) ([228f34d](https://github.com/deephaven/web-client-ui/commit/228f34d40ca2f594e0a39b7975ff4668b065d101)), closes [#1747](https://github.com/deephaven/web-client-ui/issues/1747)

### BREAKING CHANGES

- - IrisGridThemeContext no longer accepts a paritial theme. By
    guaranteeing the provider is a full theme we can resolve the CSS
    variables and normailze the colors only once per theme load globally,
    rather than having to do it once per grid.

* Themes must be defined using valid srgb CSS colors, and not hsl raw
  component values

- `usePickerWithSelectedValues` now takes an object as an
  argument instead of positional args

# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

### Bug Fixes

- hcm caret shouldn't be allowed to shrink ([#1733](https://github.com/deephaven/web-client-ui/issues/1733)) ([6547814](https://github.com/deephaven/web-client-ui/commit/65478140934157c7c5bcf27ea89151255fb18a52)), closes [deephaven-ent/iris#1274](https://github.com/deephaven-ent/iris/issues/1274)

### Features

- added shortcut for copying version info and added browser/os to info ([#1739](https://github.com/deephaven/web-client-ui/issues/1739)) ([3312133](https://github.com/deephaven/web-client-ui/commit/3312133c902ed4a5ca110296ca36311fde9c1056))
- adjust display of theme palette in styleguide ([#1745](https://github.com/deephaven/web-client-ui/issues/1745)) ([0ab0c93](https://github.com/deephaven/web-client-ui/commit/0ab0c936baaee9effc08d4d9e8d6cc3ba60f9c97))
- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
- Default Plotly map colors ([#1721](https://github.com/deephaven/web-client-ui/issues/1721)) ([e8b9f12](https://github.com/deephaven/web-client-ui/commit/e8b9f121afaeb2c3dd6484a05ca1966a1d769260))

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Bug Fixes

- Moved logos so they show in production build ([#1713](https://github.com/deephaven/web-client-ui/issues/1713)) ([a3bea73](https://github.com/deephaven/web-client-ui/commit/a3bea733b97dfafe33a54623ef8e8e04cb5aa44e)), closes [#1712](https://github.com/deephaven/web-client-ui/issues/1712)
- TimeInput not triggering onChange on incomplete values ([#1711](https://github.com/deephaven/web-client-ui/issues/1711)) ([6894d96](https://github.com/deephaven/web-client-ui/commit/6894d96f921f57f0abb108bc2f3d8d86e9fa3c56)), closes [#1710](https://github.com/deephaven/web-client-ui/issues/1710)

### Features

- Action button tooltips ([#1706](https://github.com/deephaven/web-client-ui/issues/1706)) ([bff6bf9](https://github.com/deephaven/web-client-ui/commit/bff6bf91b938bbba7f7649ac671d2e4447ea3439)), closes [#1705](https://github.com/deephaven/web-client-ui/issues/1705)
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

### Features

- Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Bug Fixes

- add right margin to <Button kind='inline'/> using icons ([#1664](https://github.com/deephaven/web-client-ui/issues/1664)) ([fd8a6c6](https://github.com/deephaven/web-client-ui/commit/fd8a6c65d64b93ba69849b6053d5bbbd9d72c4dc))
- adjust filter bar colour ([#1666](https://github.com/deephaven/web-client-ui/issues/1666)) ([4c0200e](https://github.com/deephaven/web-client-ui/commit/4c0200e71e350fcf5261b0cc28440cb798bec207))

### Features

- Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
- forward and back button for organize column search ([#1641](https://github.com/deephaven/web-client-ui/issues/1641)) ([89f2be5](https://github.com/deephaven/web-client-ui/commit/89f2be56647c977e4150f050ceec9e33f4c07680)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
- theme fontawesome icon size wrapped in spectrum icons ([#1658](https://github.com/deephaven/web-client-ui/issues/1658)) ([2aa8cef](https://github.com/deephaven/web-client-ui/commit/2aa8cef6ce5a419b20c8a74d107bd523156d8ea4))
- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
- Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))

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

### Bug Fixes

- Date argument non-optional for the onChange prop ([#1622](https://github.com/deephaven/web-client-ui/issues/1622)) ([9a960b3](https://github.com/deephaven/web-client-ui/commit/9a960b3a50eed904fce61d3e97307261582a1de7)), closes [#1601](https://github.com/deephaven/web-client-ui/issues/1601)
- Fixing grid colors and grays ([#1621](https://github.com/deephaven/web-client-ui/issues/1621)) ([9ab2b1e](https://github.com/deephaven/web-client-ui/commit/9ab2b1e3204c7f854b8526e510b1e5a5fc59b8f6)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### Features

- Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### BREAKING CHANGES

- - ChartThemeProvider is now required to provide ChartTheme

* ChartModelFactory and ChartUtils now require chartTheme args

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Features

- Babel Plugin - Mock css imports ([#1607](https://github.com/deephaven/web-client-ui/issues/1607)) ([787c542](https://github.com/deephaven/web-client-ui/commit/787c5420ecb90661ae5032e174f292707e908820)), closes [#1606](https://github.com/deephaven/web-client-ui/issues/1606)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

### Bug Fixes

- Theming - switched from ?inline to ?raw css imports ([#1600](https://github.com/deephaven/web-client-ui/issues/1600)) ([f6d0874](https://github.com/deephaven/web-client-ui/commit/f6d0874a98cc7377c3857a44930b5c636b72ca1f)), closes [#1599](https://github.com/deephaven/web-client-ui/issues/1599)

### BREAKING CHANGES

- Theme css imports were switched from `?inline` to
  `?raw`. Not likely that we have any consumers yet, but this would impact
  webpack config.

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- Adjusted Monaco "white" colors ([#1594](https://github.com/deephaven/web-client-ui/issues/1594)) ([c736708](https://github.com/deephaven/web-client-ui/commit/c736708e0dd39aa1d0f171f1e9ecf69023647021)), closes [#1592](https://github.com/deephaven/web-client-ui/issues/1592)

### Features

- Theming - Spectrum Provider ([#1582](https://github.com/deephaven/web-client-ui/issues/1582)) ([a4013c0](https://github.com/deephaven/web-client-ui/commit/a4013c0b83347197633a008b2b56006c8da12a46)), closes [#1543](https://github.com/deephaven/web-client-ui/issues/1543)
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

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

### Bug Fixes

- Right clicking with a custom context menu open should open another context menu ([#1526](https://github.com/deephaven/web-client-ui/issues/1526)) ([bd08e1f](https://github.com/deephaven/web-client-ui/commit/bd08e1fa50d938a94ead82f55b365b7c00e8d8f0)), closes [#1525](https://github.com/deephaven/web-client-ui/issues/1525)

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/components

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/components

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Features

- adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

**Note:** Version bump only for package @deephaven/components

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

**Note:** Version bump only for package @deephaven/components

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

**Note:** Version bump only for package @deephaven/components

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/components

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

**Note:** Version bump only for package @deephaven/components

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Features

- improvements to null and empty strings filters in grid ([#1348](https://github.com/deephaven/web-client-ui/issues/1348)) ([ed3a8c5](https://github.com/deephaven/web-client-ui/commit/ed3a8c5f224094306ff55f9b41706cb58ff709e2)), closes [#1243](https://github.com/deephaven/web-client-ui/issues/1243)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

**Note:** Version bump only for package @deephaven/components

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

**Note:** Version bump only for package @deephaven/components

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Bug Fixes

- drag to re-arrange custom columns not working ([#1299](https://github.com/deephaven/web-client-ui/issues/1299)) ([5e23e4a](https://github.com/deephaven/web-client-ui/commit/5e23e4a9f69eaf6fcb55e0e30ceb490ad913966e)), closes [#1282](https://github.com/deephaven/web-client-ui/issues/1282) [#1013](https://github.com/deephaven/web-client-ui/issues/1013)

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Features

- Update @vscode/codicons to v0.0.33 ([#1259](https://github.com/deephaven/web-client-ui/issues/1259)) ([1b29af1](https://github.com/deephaven/web-client-ui/commit/1b29af18fa60411a0e16ca1df27a969b11492c56))

### BREAKING CHANGES

- `vsCircleLargeOutline` icon renamed to `vsCircleLarge`

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- DH-14657 Better disconnect handling ([#1261](https://github.com/deephaven/web-client-ui/issues/1261)) ([9358e41](https://github.com/deephaven/web-client-ui/commit/9358e41fd3d7c587a45788819eec0962a8361202)), closes [#1149](https://github.com/deephaven/web-client-ui/issues/1149)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

**Note:** Version bump only for package @deephaven/components

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Features

- **@deephaven/components:** Custom React Spectrum Provider ([#1211](https://github.com/deephaven/web-client-ui/issues/1211)) ([609c57e](https://github.com/deephaven/web-client-ui/commit/609c57ed38a4a905e52e1d3e2588d3e7079a1b81)), closes [#1210](https://github.com/deephaven/web-client-ui/issues/1210)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

**Note:** Version bump only for package @deephaven/components

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

**Note:** Version bump only for package @deephaven/components

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Features

- Add signatureHelp and hover providers to monaco ([#1178](https://github.com/deephaven/web-client-ui/issues/1178)) ([f1f3abf](https://github.com/deephaven/web-client-ui/commit/f1f3abffc9df4178477714f06dcc57d40d6942a9))
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Goto Value Skips Rows on String Column, Displays Incorrect Filter, and `shift+enter` Doesn't go to Previous ([#1162](https://github.com/deephaven/web-client-ui/issues/1162)) ([e83d7c9](https://github.com/deephaven/web-client-ui/commit/e83d7c9f7265fc6402a347fa8826cef16ad3c93f)), closes [#1156](https://github.com/deephaven/web-client-ui/issues/1156) [#1157](https://github.com/deephaven/web-client-ui/issues/1157)

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

**Note:** Version bump only for package @deephaven/components

# [0.31.0](https://github.com/deephaven/web-client-ui/compare/v0.30.1...v0.31.0) (2023-03-03)

### Bug Fixes

- Clicking a folder in file explorer panel sometimes fails to open or close it ([#1099](https://github.com/deephaven/web-client-ui/issues/1099)) ([7a7fc14](https://github.com/deephaven/web-client-ui/commit/7a7fc140d8721297bbdc17af879777b27f25269a)), closes [#1085](https://github.com/deephaven/web-client-ui/issues/1085)

### Features

- isConfirmDangerProp ([#1110](https://github.com/deephaven/web-client-ui/issues/1110)) ([ffb7ada](https://github.com/deephaven/web-client-ui/commit/ffb7ada4814e03f9c4471e85319a6bb061943363)), closes [#1109](https://github.com/deephaven/web-client-ui/issues/1109)

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

### Features

- Import JS API as a module ([#1084](https://github.com/deephaven/web-client-ui/issues/1084)) ([9aab657](https://github.com/deephaven/web-client-ui/commit/9aab657ca674e404db6d3cf9b9c663627d635c2c)), closes [#444](https://github.com/deephaven/web-client-ui/issues/444)

### BREAKING CHANGES

- The JS API packaged as a module is now required for the
  `code-studio`, `embed-grid`, and `embed-chart` applications. Existing
  (Enterprise) applications should be able to use `jsapi-shim` still and
  load the JS API using the old method.

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

**Note:** Version bump only for package @deephaven/components
