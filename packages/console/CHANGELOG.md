# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

### Bug Fixes

- monaco editor overflowing at certain zoom levels ([#2346](https://github.com/deephaven/web-client-ui/issues/2346)) ([bbba404](https://github.com/deephaven/web-client-ui/commit/bbba404cb0f5cc207d4787543d5b3db3fb67bd56))

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

**Note:** Version bump only for package @deephaven/console

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

**Note:** Version bump only for package @deephaven/console

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

### Bug Fixes

- Console history did not stick to bottom on visibility changes ([#2324](https://github.com/deephaven/web-client-ui/issues/2324)) ([ca5f6cd](https://github.com/deephaven/web-client-ui/commit/ca5f6cd7b7f6af11d34be8ba532723d834a7be12))

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

### Bug Fixes

- Console history did not stick to bottom on visibility changes ([#2320](https://github.com/deephaven/web-client-ui/issues/2320)) ([648e8c0](https://github.com/deephaven/web-client-ui/commit/648e8c030bb3f03ca00fc0503874b4947f3f8d54))

### Reverts

- Revert "fix: Console history did not stick to bottom on visibility changes ([#2320](https://github.com/deephaven/web-client-ui/issues/2320))" ([#2323](https://github.com/deephaven/web-client-ui/issues/2323)) ([9d6719a](https://github.com/deephaven/web-client-ui/commit/9d6719a87e65619c523c9bec50765d768d978580))

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

**Note:** Version bump only for package @deephaven/console

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

**Note:** Version bump only for package @deephaven/console

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

**Note:** Version bump only for package @deephaven/console

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

### Features

- Ruff updates for DHE support ([#2280](https://github.com/deephaven/web-client-ui/issues/2280)) ([a35625e](https://github.com/deephaven/web-client-ui/commit/a35625efe3b918cd75d1dc07b02946398e2bca19))

### Bug Fixes

- console scrolls on 1st code block run ([#2275](https://github.com/deephaven/web-client-ui/issues/2275)) ([1fe8172](https://github.com/deephaven/web-client-ui/commit/1fe817230e8f7719c8a762519a33313f14a3872e)), closes [#2207](https://github.com/deephaven/web-client-ui/issues/2207)

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### Features

- add monaco docs CSS override ([#2250](https://github.com/deephaven/web-client-ui/issues/2250)) ([6b949d5](https://github.com/deephaven/web-client-ui/commit/6b949d5de15d0d34abf2a9b4115d505b84dc9967)), closes [#2247](https://github.com/deephaven/web-client-ui/issues/2247)

## [0.96.0](https://github.com/deephaven/web-client-ui/compare/v0.95.0...v0.96.0) (2024-10-04)

### ⚠ BREAKING CHANGES

- The app should call `MonacoUtils.init` with a `getWorker` function that
  uses the JSON worker in addition to the general fallback worker when
  adding support for configuring ruff.

### Features

- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- Change ruff errors to warnings and fix config saving ([#2246](https://github.com/deephaven/web-client-ui/issues/2246)) ([6ae25a2](https://github.com/deephaven/web-client-ui/commit/6ae25a258ff4868d74e01040bbdf959bc7dd5586))

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

**Note:** Version bump only for package @deephaven/console

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

**Note:** Version bump only for package @deephaven/console

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

**Note:** Version bump only for package @deephaven/console

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

**Note:** Version bump only for package @deephaven/console

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

### Features

- Refactor console objects menu ([#2013](https://github.com/deephaven/web-client-ui/issues/2013)) ([8251180](https://github.com/deephaven/web-client-ui/commit/825118048326d3622aec2e4b851d81e8b7d93e35)), closes [#1884](https://github.com/deephaven/web-client-ui/issues/1884)

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

**Note:** Version bump only for package @deephaven/console

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

**Note:** Version bump only for package @deephaven/console

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

**Note:** Version bump only for package @deephaven/console

## [0.85.2](https://github.com/deephaven/web-client-ui/compare/v0.85.1...v0.85.2) (2024-07-09)

**Note:** Version bump only for package @deephaven/console

## [0.85.1](https://github.com/deephaven/web-client-ui/compare/v0.85.0...v0.85.1) (2024-07-08)

**Note:** Version bump only for package @deephaven/console

## [0.85.0](https://github.com/deephaven/web-client-ui/compare/v0.84.0...v0.85.0) (2024-07-04)

**Note:** Version bump only for package @deephaven/console

## [0.84.0](https://github.com/deephaven/web-client-ui/compare/v0.83.0...v0.84.0) (2024-06-28)

### Bug Fixes

- Console does not scroll to bottom when code run from notebook ([#2114](https://github.com/deephaven/web-client-ui/issues/2114)) ([e75e716](https://github.com/deephaven/web-client-ui/commit/e75e716a2d184e3ff5572fa609301bf6ac35da99))

## [0.83.0](https://github.com/deephaven/web-client-ui/compare/v0.82.0...v0.83.0) (2024-06-25)

### Bug Fixes

- Console scroll bar following dynamic output ([#2076](https://github.com/deephaven/web-client-ui/issues/2076)) ([a91e4f3](https://github.com/deephaven/web-client-ui/commit/a91e4f348fc23618f10ac1d8c3a87bf237eb7bbd))

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

**Note:** Version bump only for package @deephaven/console

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/console

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/console

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

**Note:** Version bump only for package @deephaven/console

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

**Note:** Version bump only for package @deephaven/console

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

**Note:** Version bump only for package @deephaven/console

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))

# [0.78.0](https://github.com/deephaven/web-client-ui/compare/v0.77.0...v0.78.0) (2024-05-16)

**Note:** Version bump only for package @deephaven/console

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

**Note:** Version bump only for package @deephaven/console

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

**Note:** Version bump only for package @deephaven/console

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

**Note:** Version bump only for package @deephaven/console

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

**Note:** Version bump only for package @deephaven/console

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

**Note:** Version bump only for package @deephaven/console

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

**Note:** Version bump only for package @deephaven/console

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

**Note:** Version bump only for package @deephaven/console

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Features

- Change autoclosing bracket behavior to beforeWhitespace ([#1905](https://github.com/deephaven/web-client-ui/issues/1905)) ([80207f4](https://github.com/deephaven/web-client-ui/commit/80207f4178aa4a524de70644a715e1f030b5122d))

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

**Note:** Version bump only for package @deephaven/console

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

**Note:** Version bump only for package @deephaven/console

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

**Note:** Version bump only for package @deephaven/console

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/console

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

**Note:** Version bump only for package @deephaven/console

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Features

- exposes editor-line-number-active-fg theme variable ([#1833](https://github.com/deephaven/web-client-ui/issues/1833)) ([448f0f0](https://github.com/deephaven/web-client-ui/commit/448f0f0d5bf99be14845e3f6b0e063f55a8de775))
- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Features

- Test Utils - Generate exhaustive boolean combinations and MockProxy spread ([#1811](https://github.com/deephaven/web-client-ui/issues/1811)) ([0a2f054](https://github.com/deephaven/web-client-ui/commit/0a2f054591d04dd32c4919ce90fd538638e0b563)), closes [#1809](https://github.com/deephaven/web-client-ui/issues/1809)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/console

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

**Note:** Version bump only for package @deephaven/console

# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/console

## [0.61.1](https://github.com/deephaven/web-client-ui/compare/v0.61.0...v0.61.1) (2024-02-02)

### Bug Fixes

- apply theme accent color scale and other small tweaks ([#1768](https://github.com/deephaven/web-client-ui/issues/1768)) ([1e631a4](https://github.com/deephaven/web-client-ui/commit/1e631a470bff851f8c0d4401a43bc08d0c974391))

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

- Handle undefined DashboardData props ([#1726](https://github.com/deephaven/web-client-ui/issues/1726)) ([45fa929](https://github.com/deephaven/web-client-ui/commit/45fa929586c0b13a738eceaa064b261eecbd8308)), closes [#1684](https://github.com/deephaven/web-client-ui/issues/1684) [#1685](https://github.com/deephaven/web-client-ui/issues/1685)

### Features

- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
- Multiple dashboards ([#1714](https://github.com/deephaven/web-client-ui/issues/1714)) ([32dde3c](https://github.com/deephaven/web-client-ui/commit/32dde3c57765593889216cd3e27d1740ff357af1)), closes [#1683](https://github.com/deephaven/web-client-ui/issues/1683)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Bug Fixes

- re-colorize command codeblocks when theme changes ([#1731](https://github.com/deephaven/web-client-ui/issues/1731)) ([b1e42f5](https://github.com/deephaven/web-client-ui/commit/b1e42f58df5c9c478ff47d4823b517e23a94709f))

### Features

- theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Features

- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

**Note:** Version bump only for package @deephaven/console

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

### Features

- Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Features

- Tables that have names starting with underscore do not auto-launch from console ([#1656](https://github.com/deephaven/web-client-ui/issues/1656)) ([21131fe](https://github.com/deephaven/web-client-ui/commit/21131fe3cb508d8e6fb057d3bae993ca3dd1a23b)), closes [#1549](https://github.com/deephaven/web-client-ui/issues/1549) [#1410](https://github.com/deephaven/web-client-ui/issues/1410)
- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.
- Tables assigned to variable beginning with "\_" will not
  open automatically even if "Auto Launch Panels" is checked.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/console

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Features

- Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### BREAKING CHANGES

- - ChartThemeProvider is now required to provide ChartTheme

* ChartModelFactory and ChartUtils now require chartTheme args

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/console

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
- Tab in console input triggers autocomplete instead of indent ([#1591](https://github.com/deephaven/web-client-ui/issues/1591)) ([fbe1e70](https://github.com/deephaven/web-client-ui/commit/fbe1e70135008db293878368ad62f742b8166e19))

### Features

- Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))
- Widget plugins ([#1564](https://github.com/deephaven/web-client-ui/issues/1564)) ([94cc82c](https://github.com/deephaven/web-client-ui/commit/94cc82c379103326669d477ae96ec253041f2967)), closes [#1455](https://github.com/deephaven/web-client-ui/issues/1455) [#1167](https://github.com/deephaven/web-client-ui/issues/1167)

### BREAKING CHANGES

- Enterprise will need ThemeProvider for the css
  variables to be available

# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)

### BREAKING CHANGES

- Theme variables have to be present on body to avoid
  Monaco init failing
- Inline LoadingSpinner instances will need to be
  decorated with `className="loading-spinner-vertical-align"` for vertical
  alignment to work as before

## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)

**Note:** Version bump only for package @deephaven/console

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/console

# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/console

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Bug Fixes

- Console History Not Scrolling to Bottom (DH-14062) ([#1481](https://github.com/deephaven/web-client-ui/issues/1481)) ([93687a7](https://github.com/deephaven/web-client-ui/commit/93687a78fa2d0e2da567efd8da2c671252ba8fe5))

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)
- Zip CSV uploads not working ([#1457](https://github.com/deephaven/web-client-ui/issues/1457)) ([08d0296](https://github.com/deephaven/web-client-ui/commit/08d0296fee6a695c8312dec7d3bed648f10c7acb)), closes [#1080](https://github.com/deephaven/web-client-ui/issues/1080) [#1416](https://github.com/deephaven/web-client-ui/issues/1416)

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

### Bug Fixes

- Cannot import CSV with LOCAL_TIME ([#1434](https://github.com/deephaven/web-client-ui/issues/1434)) ([caa6bc8](https://github.com/deephaven/web-client-ui/commit/caa6bc8a801176b4624127aeb3c1e1cf1e346df3)), closes [#1432](https://github.com/deephaven/web-client-ui/issues/1432)

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
