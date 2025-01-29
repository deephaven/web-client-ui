# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.104.0](https://github.com/deephaven/web-client-ui/compare/v0.103.0...v0.104.0) (2025-01-23)

### Features

- Add global shortcut to export logs ([#2336](https://github.com/deephaven/web-client-ui/issues/2336)) ([6e813fd](https://github.com/deephaven/web-client-ui/commit/6e813fdc6837de9e85c0e139aaf0de9e02e452c2)), closes [#1963](https://github.com/deephaven/web-client-ui/issues/1963)
- Support for log message handlers ([#2347](https://github.com/deephaven/web-client-ui/issues/2347)) ([cbab7a2](https://github.com/deephaven/web-client-ui/commit/cbab7a246ef2dc3c31abcc916c20d4442e9db45a))

### Bug Fixes

- Ensure ErrorBoundary and PanelErrorBoundary do not throw ([#2345](https://github.com/deephaven/web-client-ui/issues/2345)) ([675b110](https://github.com/deephaven/web-client-ui/commit/675b1106cb9b67d898857dd427fb437d2cb9d1ad))
- monaco editor overflowing at certain zoom levels ([#2346](https://github.com/deephaven/web-client-ui/issues/2346)) ([bbba404](https://github.com/deephaven/web-client-ui/commit/bbba404cb0f5cc207d4787543d5b3db3fb67bd56))

## [0.103.0](https://github.com/deephaven/web-client-ui/compare/v0.102.1...v0.103.0) (2025-01-16)

### Features

- DH-18086: gRPC transport implementation for nodejs backed by http2 ([#2339](https://github.com/deephaven/web-client-ui/issues/2339)) ([3b5c7d3](https://github.com/deephaven/web-client-ui/commit/3b5c7d383797967bc34be643870dcb9236acf786))
- Made event details generic ([#2343](https://github.com/deephaven/web-client-ui/issues/2343)) ([b3260f0](https://github.com/deephaven/web-client-ui/commit/b3260f05bbd76be0dd804524b4fd52168fb44527))

### Bug Fixes

- Markdown incorrectly rendering inline code blocks ([#2342](https://github.com/deephaven/web-client-ui/issues/2342)) ([f85c76f](https://github.com/deephaven/web-client-ui/commit/f85c76f97fffda5c94a3b3a6f8acc39c4d5bce20)), closes [#2312](https://github.com/deephaven/web-client-ui/issues/2312)
- Update Spectrum Theme for Missing ContextualHelpTrigger Icon ([#2330](https://github.com/deephaven/web-client-ui/issues/2330)) ([5f6c8d6](https://github.com/deephaven/web-client-ui/commit/5f6c8d6a30099ac33fc6e35536b2ddfa9df528ca))

## [0.102.1](https://github.com/deephaven/web-client-ui/compare/v0.102.0...v0.102.1) (2025-01-10)

### Bug Fixes

- ComboBox show all items on open ([#2328](https://github.com/deephaven/web-client-ui/issues/2328)) ([c08bb7b](https://github.com/deephaven/web-client-ui/commit/c08bb7bacd579bd868ad2c2874cf9db0c5404e66))

## [0.102.0](https://github.com/deephaven/web-client-ui/compare/v0.101.0...v0.102.0) (2025-01-03)

### Features

- Removed esbuild runtime dependency ([#2327](https://github.com/deephaven/web-client-ui/issues/2327)) ([f33ab5a](https://github.com/deephaven/web-client-ui/commit/f33ab5a680ffaeba9e3c776b1117149d16d505b9))

### Bug Fixes

- accordion, disclosure, color picker, color editor export ([#2325](https://github.com/deephaven/web-client-ui/issues/2325)) ([b6e4eb2](https://github.com/deephaven/web-client-ui/commit/b6e4eb2428cff547f962cfe16957b2c4bda23527))
- Console history did not stick to bottom on visibility changes ([#2324](https://github.com/deephaven/web-client-ui/issues/2324)) ([ca5f6cd](https://github.com/deephaven/web-client-ui/commit/ca5f6cd7b7f6af11d34be8ba532723d834a7be12))

## [0.101.0](https://github.com/deephaven/web-client-ui/compare/v0.100.0...v0.101.0) (2024-12-30)

### Features

- Export Spectrum Menu and SubmenuTrigger ([#2322](https://github.com/deephaven/web-client-ui/issues/2322)) ([d4eab8a](https://github.com/deephaven/web-client-ui/commit/d4eab8addec36b866991c158b5a045f788ccd6ef))

### Bug Fixes

- Console history did not stick to bottom on visibility changes ([#2320](https://github.com/deephaven/web-client-ui/issues/2320)) ([648e8c0](https://github.com/deephaven/web-client-ui/commit/648e8c030bb3f03ca00fc0503874b4947f3f8d54))

### Reverts

- Revert "fix: Console history did not stick to bottom on visibility changes ([#2320](https://github.com/deephaven/web-client-ui/issues/2320))" ([#2323](https://github.com/deephaven/web-client-ui/issues/2323)) ([9d6719a](https://github.com/deephaven/web-client-ui/commit/9d6719a87e65619c523c9bec50765d768d978580))

## [0.100.0](https://github.com/deephaven/web-client-ui/compare/v0.99.1...v0.100.0) (2024-12-18)

### Features

- datetime tooltip to show full value ([#2286](https://github.com/deephaven/web-client-ui/issues/2286)) ([238f611](https://github.com/deephaven/web-client-ui/commit/238f611c1707c06170509eb093485620bb0c5801)), closes [#614](https://github.com/deephaven/web-client-ui/issues/614)

### Bug Fixes

- Allow double and float types to be rollupable ([#2311](https://github.com/deephaven/web-client-ui/issues/2311)) ([ab5b3b6](https://github.com/deephaven/web-client-ui/commit/ab5b3b65e42426b63027c3c520d68605809ce222)), closes [#2295](https://github.com/deephaven/web-client-ui/issues/2295)
- Swapping esbuild for esbuild-wasm to fix OS specific dependency ([#2317](https://github.com/deephaven/web-client-ui/issues/2317)) ([f37d25f](https://github.com/deephaven/web-client-ui/commit/f37d25f329e780f66e85b27e0cd0e48e70dcfef3))
- Table plugins - pass through deprecated props ([#2308](https://github.com/deephaven/web-client-ui/issues/2308)) ([d884bff](https://github.com/deephaven/web-client-ui/commit/d884bffe5942af0baa0224a688661e5ea8917ea5)), closes [#2274](https://github.com/deephaven/web-client-ui/issues/2274)

## [0.99.1](https://github.com/deephaven/web-client-ui/compare/v0.99.0...v0.99.1) (2024-11-29)

### Bug Fixes

- Embed-widget not setting log level on init ([#2301](https://github.com/deephaven/web-client-ui/issues/2301)) ([1309cd2](https://github.com/deephaven/web-client-ui/commit/1309cd21a893e58138535ddbbe04025475a4ef06))
- open file blocks logout ([#2281](https://github.com/deephaven/web-client-ui/issues/2281)) ([7ff0e53](https://github.com/deephaven/web-client-ui/commit/7ff0e53ac41887fa22f2591b5df2439ac9984397)), closes [#1685](https://github.com/deephaven/web-client-ui/issues/1685)
- Partial holidays range breaks ([#2297](https://github.com/deephaven/web-client-ui/issues/2297)) ([ab4c02f](https://github.com/deephaven/web-client-ui/commit/ab4c02fe50eea0339a585b40fb3d56376ea9517b))
- Update react-spectrum packages ([#2303](https://github.com/deephaven/web-client-ui/issues/2303)) ([2216274](https://github.com/deephaven/web-client-ui/commit/2216274b416d9b1587a29c130dd19dd21accaa4b))

## [0.99.0](https://github.com/deephaven/web-client-ui/compare/v0.98.0...v0.99.0) (2024-11-15)

### Features

- Export Spectrum Toast from Components Package ([#2294](https://github.com/deephaven/web-client-ui/issues/2294)) ([a0961ad](https://github.com/deephaven/web-client-ui/commit/a0961ad161adf261c205642a3c3b9203b8892409))
- update version info pop-up with python/groovy version ([#2291](https://github.com/deephaven/web-client-ui/issues/2291)) ([a273b07](https://github.com/deephaven/web-client-ui/commit/a273b07228cbb82793e6762cbd9c65560bcd773c)), closes [#2184](https://github.com/deephaven/web-client-ui/issues/2184) [#2289](https://github.com/deephaven/web-client-ui/issues/2289)

### Bug Fixes

- missing search field import ([#2292](https://github.com/deephaven/web-client-ui/issues/2292)) ([cb1f11f](https://github.com/deephaven/web-client-ui/commit/cb1f11f43cc753fb5eb825f7a524f4285e3d1400)), closes [#2287](https://github.com/deephaven/web-client-ui/issues/2287)

## [0.98.0](https://github.com/deephaven/web-client-ui/compare/v0.97.0...v0.98.0) (2024-11-12)

### Features

- Added a 404 status check ([#2272](https://github.com/deephaven/web-client-ui/issues/2272)) ([b552282](https://github.com/deephaven/web-client-ui/commit/b5522828a3bc812e7e83440b6d52257a131ce1d2)), closes [#2271](https://github.com/deephaven/web-client-ui/issues/2271)
- Ruff updates for DHE support ([#2280](https://github.com/deephaven/web-client-ui/issues/2280)) ([a35625e](https://github.com/deephaven/web-client-ui/commit/a35625efe3b918cd75d1dc07b02946398e2bca19))

### Bug Fixes

- --dh-color-overlay-modal-bg theme background color to be black not gray ([#2277](https://github.com/deephaven/web-client-ui/issues/2277)) ([aba019a](https://github.com/deephaven/web-client-ui/commit/aba019af902d74a3c8c558c0549b535b985234a4)), closes [#2276](https://github.com/deephaven/web-client-ui/issues/2276)
- console scrolls on 1st code block run ([#2275](https://github.com/deephaven/web-client-ui/issues/2275)) ([1fe8172](https://github.com/deephaven/web-client-ui/commit/1fe817230e8f7719c8a762519a33313f14a3872e)), closes [#2207](https://github.com/deephaven/web-client-ui/issues/2207)
- Externalized esbuild dependency (2284) ([#2285](https://github.com/deephaven/web-client-ui/issues/2285)) ([8ccab6d](https://github.com/deephaven/web-client-ui/commit/8ccab6d73eb256dd266dd35c69f5c89a4bf9cf4d)), closes [#2284](https://github.com/deephaven/web-client-ui/issues/2284)

## [0.97.0](https://github.com/deephaven/web-client-ui/compare/v0.96.1...v0.97.0) (2024-10-23)

### ⚠ BREAKING CHANGES

- `RefreshToken` related classes have been removed from `@deephaven/jsapi-components`. This functionality did not actually work in Core, and was unused. The `RefreshToken` type is now defined in `@deephaven/jsapi-types`, as `dh.RefreshToken`.

### Features

- @deephaven/jsapi-nodejs npm package ([#2260](https://github.com/deephaven/web-client-ui/issues/2260)) ([72507d3](https://github.com/deephaven/web-client-ui/commit/72507d3e03c74a7004b1f42b48bc95b80cdbea42))
- add monaco docs CSS override ([#2250](https://github.com/deephaven/web-client-ui/issues/2250)) ([6b949d5](https://github.com/deephaven/web-client-ui/commit/6b949d5de15d0d34abf2a9b4115d505b84dc9967)), closes [#2247](https://github.com/deephaven/web-client-ui/issues/2247)
- Add render blocking errors to Chart ([#2255](https://github.com/deephaven/web-client-ui/issues/2255)) ([74a5cb7](https://github.com/deephaven/web-client-ui/commit/74a5cb7bd89a82b811434c982f95d1143c596b44))
- add thousands format for numbers ([#2261](https://github.com/deephaven/web-client-ui/issues/2261)) ([0802f8a](https://github.com/deephaven/web-client-ui/commit/0802f8afc0eae6d4926ddee4ffcc29b327ce4d7c)), closes [#2253](https://github.com/deephaven/web-client-ui/issues/2253)
- Branded type utils ([#2264](https://github.com/deephaven/web-client-ui/issues/2264)) ([fff0155](https://github.com/deephaven/web-client-ui/commit/fff0155f2e7b431faca755e028e7dbe3123dac63)), closes [#2263](https://github.com/deephaven/web-client-ui/issues/2263)

### Bug Fixes

- add gap between type and name in widget panel tooltip ([#2258](https://github.com/deephaven/web-client-ui/issues/2258)) ([4e8ad58](https://github.com/deephaven/web-client-ui/commit/4e8ad58c0ae5c162e8aca360cc009f9deafe3a29)), closes [#2254](https://github.com/deephaven/web-client-ui/issues/2254)
- Fix Type in Spectrum Modal Overlay Background Color ([#2267](https://github.com/deephaven/web-client-ui/issues/2267)) ([9d84d8d](https://github.com/deephaven/web-client-ui/commit/9d84d8df388031f73aea16cefece9b0bea2790a4))
- Remove RefreshBootstrap and refresh token handling ([#2257](https://github.com/deephaven/web-client-ui/issues/2257)) ([5686032](https://github.com/deephaven/web-client-ui/commit/5686032603e583de4cc85e320f189f4b17de4e47))

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

- checkbox_group re-export ([#2212](https://github.com/deephaven/web-client-ui/issues/2212)) ([a24dc8c](https://github.com/deephaven/web-client-ui/commit/a24dc8c447bc892aea2947641c32371d348042dc)), closes [#2211](https://github.com/deephaven/web-client-ui/issues/2211)
- Ruff Python formatter and linter ([#2233](https://github.com/deephaven/web-client-ui/issues/2233)) ([4839d72](https://github.com/deephaven/web-client-ui/commit/4839d72d3f0b9060efaa83ba054c40e0bff86522)), closes [#1255](https://github.com/deephaven/web-client-ui/issues/1255)

### Bug Fixes

- Change ruff errors to warnings and fix config saving ([#2246](https://github.com/deephaven/web-client-ui/issues/2246)) ([6ae25a2](https://github.com/deephaven/web-client-ui/commit/6ae25a258ff4868d74e01040bbdf959bc7dd5586))
- Closing tab with middle mouse on Linux pasting into active editor ([#2240](https://github.com/deephaven/web-client-ui/issues/2240)) ([91bd8fe](https://github.com/deephaven/web-client-ui/commit/91bd8fe18fc0ae8cdc40775a71f63e2d7b6e8355)), closes [#1461](https://github.com/deephaven/web-client-ui/issues/1461)
- DH-17537: Fix Advanced Filter dialog not showing the values list on tree tables ([#2232](https://github.com/deephaven/web-client-ui/issues/2232)) ([86e16ee](https://github.com/deephaven/web-client-ui/commit/86e16eec31eed6a4e89a18c6412d4396a724bac0))
- DH-17730: Fix Proxy Model Undefined Formatter ([#2237](https://github.com/deephaven/web-client-ui/issues/2237)) ([ee1bc2f](https://github.com/deephaven/web-client-ui/commit/ee1bc2f0d5d4bfe69ae667d51cc9d94bfed905d4))
- improve color contrast of editor find in dark mode ([#2248](https://github.com/deephaven/web-client-ui/issues/2248)) ([f8dd133](https://github.com/deephaven/web-client-ui/commit/f8dd1332b2027f93c5b9cbb174f79261298d0ea5))
- Layout shifts when opening and closing panels from a fresh state ([#2241](https://github.com/deephaven/web-client-ui/issues/2241)) ([aad0aa6](https://github.com/deephaven/web-client-ui/commit/aad0aa6a52d45cc7e5faf89d967a33d6b3714aa9)), closes [#1268](https://github.com/deephaven/web-client-ui/issues/1268)
- Reuse dashboard tabs when reassigning the variable ([#2243](https://github.com/deephaven/web-client-ui/issues/2243)) ([d2c6eab](https://github.com/deephaven/web-client-ui/commit/d2c6eabb1fe313708fadd6676858466710159fda)), closes [#1971](https://github.com/deephaven/web-client-ui/issues/1971)

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

### Features

- Pass through additional actions from WidgetPanel ([#2224](https://github.com/deephaven/web-client-ui/issues/2224)) ([bc720d1](https://github.com/deephaven/web-client-ui/commit/bc720d1789a5e28c99b06d496e58187fb4b26038))

### Code Refactoring

- Split out @deephaven/test-utils package ([#2225](https://github.com/deephaven/web-client-ui/issues/2225)) ([1d027d3](https://github.com/deephaven/web-client-ui/commit/1d027d3f6c0b47910cc0b8285c471e90c5f113a8)), closes [#2185](https://github.com/deephaven/web-client-ui/issues/2185)

## [0.93.0](https://github.com/deephaven/web-client-ui/compare/v0.92.0...v0.93.0) (2024-09-12)

### Features

- Add clickOutside prop to Modal ([#2214](https://github.com/deephaven/web-client-ui/issues/2214)) ([d78ad6d](https://github.com/deephaven/web-client-ui/commit/d78ad6d0e883a4c4c76078ae8b09c611fab35ae9))

### Bug Fixes

- ChartBuilderPlugin fixes for charts built from PPQs in Enterprise ([#2167](https://github.com/deephaven/web-client-ui/issues/2167)) ([99b8d59](https://github.com/deephaven/web-client-ui/commit/99b8d5952ba325bf74d2d16ed39eb7a2e897d196))
- Publish WidgetPanelProps ([#2210](https://github.com/deephaven/web-client-ui/issues/2210)) ([7331976](https://github.com/deephaven/web-client-ui/commit/7331976004ed9b33fca9d97919d359dd881e8d0a)), closes [/github.com/deephaven-ent/iris/pull/2114/files#diff-536d6ac232028a4ebbafc5ca79bb1a22844488a4b628196e43056379f9326a90R17](https://github.com/deephaven//github.com/deephaven-ent/iris/pull/2114/files/issues/diff-536d6ac232028a4ebbafc5ca79bb1a22844488a4b628196e43056379f9326a90R17)
- Use correct offset in snapshot ([#2217](https://github.com/deephaven/web-client-ui/issues/2217)) ([a479d6c](https://github.com/deephaven/web-client-ui/commit/a479d6c5f907f53aaa6500845ea168ab0eb9bb09))

## [0.92.0](https://github.com/deephaven/web-client-ui/compare/v0.91.0...v0.92.0) (2024-09-03)

### Features

- Make rollup group behaviour a setting in the global settings menu ([#2183](https://github.com/deephaven/web-client-ui/issues/2183)) ([bc8d5f2](https://github.com/deephaven/web-client-ui/commit/bc8d5f24ac7f883c0f9d65ba47901f83f996e95c)), closes [#2128](https://github.com/deephaven/web-client-ui/issues/2128)
- Set selected theme via query string param ([#2204](https://github.com/deephaven/web-client-ui/issues/2204)) ([89ede66](https://github.com/deephaven/web-client-ui/commit/89ede667c56746b3ff17cc7ecb6d9153aa6c2edc)), closes [#2203](https://github.com/deephaven/web-client-ui/issues/2203)

### Bug Fixes

- DH-17292 Handle disconnect from GridWidgetPlugin ([#2086](https://github.com/deephaven/web-client-ui/issues/2086)) ([0a924cd](https://github.com/deephaven/web-client-ui/commit/0a924cd5fe13e16642c50a59842c361bfff3788e))
- Invalid import in @deephaven/components for webpack ([#2200](https://github.com/deephaven/web-client-ui/issues/2200)) ([dcc95f6](https://github.com/deephaven/web-client-ui/commit/dcc95f69ff3a94a0558093ed699f8147096b2556)), closes [#2192](https://github.com/deephaven/web-client-ui/issues/2192)

## [0.91.0](https://github.com/deephaven/web-client-ui/compare/v0.90.0...v0.91.0) (2024-08-23)

### Features

- Deephaven UI table databar support ([#2190](https://github.com/deephaven/web-client-ui/issues/2190)) ([b5ce598](https://github.com/deephaven/web-client-ui/commit/b5ce598478797125371ae0952ab6e84aca07efba))

## [0.90.0](https://github.com/deephaven/web-client-ui/compare/v0.89.0...v0.90.0) (2024-08-21)

### ⚠ BREAKING CHANGES

- Delete unused event types: `openPQObject`,
  `openControl`, `reload`, `clearAllFilters`.

### Bug Fixes

- GridMetrics including totals rows in visible rows when scrolled to bottom ([#2194](https://github.com/deephaven/web-client-ui/issues/2194)) ([d409e96](https://github.com/deephaven/web-client-ui/commit/d409e96bc0c191e4d1766397ef1e5334af0102dd))
- makeEventFunctions take an array of parameters ([#2186](https://github.com/deephaven/web-client-ui/issues/2186)) ([f5b01fd](https://github.com/deephaven/web-client-ui/commit/f5b01fdd69de13233f9e08ef76979e7c07b1759c))
- TablePlugin needs to know table name and selected range ([#2181](https://github.com/deephaven/web-client-ui/issues/2181)) ([0b37477](https://github.com/deephaven/web-client-ui/commit/0b3747782958dc8e432fabda89ac0bce25ac9c22)), closes [#2093](https://github.com/deephaven/web-client-ui/issues/2093)

### Code Refactoring

- Change TabEvent to object literal, add TabEventMap ([#2191](https://github.com/deephaven/web-client-ui/issues/2191)) ([419f95d](https://github.com/deephaven/web-client-ui/commit/419f95d05c5db52e7b068398d6d2520b77c6aad3))

## [0.89.0](https://github.com/deephaven/web-client-ui/compare/v0.88.0...v0.89.0) (2024-08-15)

### Features

- Refactor console objects menu ([#2013](https://github.com/deephaven/web-client-ui/issues/2013)) ([8251180](https://github.com/deephaven/web-client-ui/commit/825118048326d3622aec2e4b851d81e8b7d93e35)), closes [#1884](https://github.com/deephaven/web-client-ui/issues/1884)

### Bug Fixes

- Errors thrown during a grid update are not caught ([#2188](https://github.com/deephaven/web-client-ui/issues/2188)) ([2e59b92](https://github.com/deephaven/web-client-ui/commit/2e59b92b8ceac211c1d27931513e57136a9fa42c))
- Proxy model not setting defined values in parent class ([#2187](https://github.com/deephaven/web-client-ui/issues/2187)) ([5f9cf7f](https://github.com/deephaven/web-client-ui/commit/5f9cf7f4f39cb19f680e38f907d67201389fea7f))
- Restrict @adobe/spectrum imports ([#2179](https://github.com/deephaven/web-client-ui/issues/2179)) ([a257296](https://github.com/deephaven/web-client-ui/commit/a257296f1433d158439e6ea1b341c81551a38c11)), closes [#1908](https://github.com/deephaven/web-client-ui/issues/1908)

## [0.88.0](https://github.com/deephaven/web-client-ui/compare/v0.87.0...v0.88.0) (2024-08-06)

### Features

- Allow ref callback for Chart and ChartPanel ([#2174](https://github.com/deephaven/web-client-ui/issues/2174)) ([56d1fa9](https://github.com/deephaven/web-client-ui/commit/56d1fa9ba00d319794d686365be245c757ad2178))
- Export Internationalized Date Types for DatePicker ([#2170](https://github.com/deephaven/web-client-ui/issues/2170)) ([7fb4f64](https://github.com/deephaven/web-client-ui/commit/7fb4f64bf9822c95faa961c53f480da4ea9e0401))

### Bug Fixes

- Check for the getBaseTable API before calling it ([#2168](https://github.com/deephaven/web-client-ui/issues/2168)) ([a5cb947](https://github.com/deephaven/web-client-ui/commit/a5cb94745797e5568826c26ed0cf8e60131326d2))
- DH-17454: Combine modal classes instead of replacing ([#2173](https://github.com/deephaven/web-client-ui/issues/2173)) ([a2d5d5f](https://github.com/deephaven/web-client-ui/commit/a2d5d5f9a63ab2d7ec37b95c716f4bf1ae03b9b8))
- DH-17454: Wrap Modal in SpectrumThemeProvider ([#2169](https://github.com/deephaven/web-client-ui/issues/2169)) ([0058b18](https://github.com/deephaven/web-client-ui/commit/0058b1801c1bfb21e3961a31a8a1c7a27443abb4))
- Input Tables cannot paste more rows than number of visible rows ([#2152](https://github.com/deephaven/web-client-ui/issues/2152)) ([1d51585](https://github.com/deephaven/web-client-ui/commit/1d515850af5affe2ec3ce116cc526097f1c4f389))
- Propogation of Scroll Events when Scroll Position is at a Boundary ([#2166](https://github.com/deephaven/web-client-ui/issues/2166)) ([cb72d29](https://github.com/deephaven/web-client-ui/commit/cb72d294f162a0ca06758692c675b2aeee732a83)), closes [#2101](https://github.com/deephaven/web-client-ui/issues/2101)
- Restrict officially supported browserlist ([#2159](https://github.com/deephaven/web-client-ui/issues/2159)) ([5b06ecc](https://github.com/deephaven/web-client-ui/commit/5b06eccca1c2dff625bae34e3801940f19e7bb56)), closes [#1752](https://github.com/deephaven/web-client-ui/issues/1752)

## [0.87.0](https://github.com/deephaven/web-client-ui/compare/v0.86.1...v0.87.0) (2024-07-22)

### ⚠ BREAKING CHANGES

- Fix any try / catch blocks that return non-awaited
  Promises

### Features

- Adjustable grid density ([#2151](https://github.com/deephaven/web-client-ui/issues/2151)) ([6bb11f9](https://github.com/deephaven/web-client-ui/commit/6bb11f9a527310801041011be3be78cae07a8bc8)), closes [#885](https://github.com/deephaven/web-client-ui/issues/885)

### Bug Fixes

- Enabled @typescript-eslint/return-await rule and fixed offending code ([#2157](https://github.com/deephaven/web-client-ui/issues/2157)) ([7875d03](https://github.com/deephaven/web-client-ui/commit/7875d03fdbe2dfa1c051c6dfa42cc1d9e7469afb)), closes [#2154](https://github.com/deephaven/web-client-ui/issues/2154)

## [0.86.1](https://github.com/deephaven/web-client-ui/compare/v0.86.0...v0.86.1) (2024-07-18)

### Bug Fixes

- add back panel prop to IrisGrid Plugin ([#2155](https://github.com/deephaven/web-client-ui/issues/2155)) ([6362eb7](https://github.com/deephaven/web-client-ui/commit/6362eb7b5292209abd9d473792cf3ecb55ade452)), closes [#2093](https://github.com/deephaven/web-client-ui/issues/2093)
- Remove the session wrapper from the embedded widget app ([#2158](https://github.com/deephaven/web-client-ui/issues/2158)) ([b76c1d7](https://github.com/deephaven/web-client-ui/commit/b76c1d73325ef38b1d9e10619b1bc806e430c409))

## [0.86.0](https://github.com/deephaven/web-client-ui/compare/v0.85.2...v0.86.0) (2024-07-17)

### Features

- Add option to disable WebGL rendering ([#2134](https://github.com/deephaven/web-client-ui/issues/2134)) ([011eb33](https://github.com/deephaven/web-client-ui/commit/011eb33b067412ffb6362237c9f6dc7256476bcd))
- Core plugins refactor, XComponent framework ([#2150](https://github.com/deephaven/web-client-ui/issues/2150)) ([2571fad](https://github.com/deephaven/web-client-ui/commit/2571faddee86d3c93e7814eb9034e606578ac040))
- IrisGridTheme iconSize ([#2123](https://github.com/deephaven/web-client-ui/issues/2123)) ([58ee88d](https://github.com/deephaven/web-client-ui/commit/58ee88dc92bfe9a283ebc789c93f23639a954ba3)), closes [#885](https://github.com/deephaven/web-client-ui/issues/885)
- Partitioned Table UI Enhancements ([#2110](https://github.com/deephaven/web-client-ui/issues/2110)) ([de5ce40](https://github.com/deephaven/web-client-ui/commit/de5ce405dde8d62777f7a17201e121b22fe26fdb)), closes [#2079](https://github.com/deephaven/web-client-ui/issues/2079) [#2066](https://github.com/deephaven/web-client-ui/issues/2066) [#2103](https://github.com/deephaven/web-client-ui/issues/2103) [#2104](https://github.com/deephaven/web-client-ui/issues/2104) [#2105](https://github.com/deephaven/web-client-ui/issues/2105) [#2106](https://github.com/deephaven/web-client-ui/issues/2106) [#2107](https://github.com/deephaven/web-client-ui/issues/2107) [#2108](https://github.com/deephaven/web-client-ui/issues/2108) [#2109](https://github.com/deephaven/web-client-ui/issues/2109) [#2049](https://github.com/deephaven/web-client-ui/issues/2049) [#2120](https://github.com/deephaven/web-client-ui/issues/2120) [#1904](https://github.com/deephaven/web-client-ui/issues/1904)

### Bug Fixes

- error when edited cell is out of grid viewport ([#2148](https://github.com/deephaven/web-client-ui/issues/2148)) ([3fccd43](https://github.com/deephaven/web-client-ui/commit/3fccd4331526516d443086acd809942ecb2e497d)), closes [#2087](https://github.com/deephaven/web-client-ui/issues/2087)

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

### ⚠ BREAKING CHANGES

- - @deephaven/jsapi-components - The contract of
    `useSearchableViewportData` to be more consistent with
    `useViewportData`. `usePickerWithSelectedValues` now requires
    `timeZone`.

* @deephaven/jsapi-utils - `createSearchTextFilter` requires `timeZone`

### Features

- useSearchableViewportData - support non-text filters ([#2092](https://github.com/deephaven/web-client-ui/issues/2092)) ([7009e21](https://github.com/deephaven/web-client-ui/commit/7009e2142d6f1624d0810a027e19e3a2b567e38a)), closes [#2102](https://github.com/deephaven/web-client-ui/issues/2102) [#2091](https://github.com/deephaven/web-client-ui/issues/2091)

### Bug Fixes

- `isElementOfType` Improved type inference ([#2099](https://github.com/deephaven/web-client-ui/issues/2099)) ([e13c9d7](https://github.com/deephaven/web-client-ui/commit/e13c9d78decdfba2ff76657a024b2df44f2ae0fc)), closes [#2094](https://github.com/deephaven/web-client-ui/issues/2094)
- Console does not scroll to bottom when code run from notebook ([#2114](https://github.com/deephaven/web-client-ui/issues/2114)) ([e75e716](https://github.com/deephaven/web-client-ui/commit/e75e716a2d184e3ff5572fa609301bf6ac35da99))
- make textValue default to key for Normalized Item ([#2113](https://github.com/deephaven/web-client-ui/issues/2113)) ([bd3e944](https://github.com/deephaven/web-client-ui/commit/bd3e944a53fe577fb48a3c8720c8b9c3881a5a04))
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
- ComboBoxNormalized - windowed data component ([#2072](https://github.com/deephaven/web-client-ui/issues/2072)) ([a30341a](https://github.com/deephaven/web-client-ui/commit/a30341a728625dc7fdc2b0a54b88dfc737977b7a)), closes [#2071](https://github.com/deephaven/web-client-ui/issues/2071)
- Embed widget loading workspace settings ([#2068](https://github.com/deephaven/web-client-ui/issues/2068)) ([b090f20](https://github.com/deephaven/web-client-ui/commit/b090f200b38a7ecab1056b17f445c2af3ae09a41)), closes [#1964](https://github.com/deephaven/web-client-ui/issues/1964)
- Export iris-grid mouse handlers ([#2083](https://github.com/deephaven/web-client-ui/issues/2083)) ([336c078](https://github.com/deephaven/web-client-ui/commit/336c07872af4f750c8b3d38638a8893670e0881a))

### Bug Fixes

- Console scroll bar following dynamic output ([#2076](https://github.com/deephaven/web-client-ui/issues/2076)) ([a91e4f3](https://github.com/deephaven/web-client-ui/commit/a91e4f348fc23618f10ac1d8c3a87bf237eb7bbd))
- Dashboard plugin crashing UI on throw ([#2080](https://github.com/deephaven/web-client-ui/issues/2080)) ([e6b55cf](https://github.com/deephaven/web-client-ui/commit/e6b55cf78561a1508d49109e9003813b9cc27262))
- DH-17199: Filter by value in the tree table context menu always shows null ([#2078](https://github.com/deephaven/web-client-ui/issues/2078)) ([4eb38dd](https://github.com/deephaven/web-client-ui/commit/4eb38dd2c47071516269662f8a975044e6bb0a9a))
- Reconnect Auth Fail Fix - embed-widget ([#2023](https://github.com/deephaven/web-client-ui/issues/2023)) ([3e52242](https://github.com/deephaven/web-client-ui/commit/3e522428b88ed59cb9f8c38612a80236fd219e5d))
- view border styling ([#2063](https://github.com/deephaven/web-client-ui/issues/2063)) ([6f99e6b](https://github.com/deephaven/web-client-ui/commit/6f99e6b764a63e31aec36d435ec62926d109955e))

## [0.82.0](https://github.com/deephaven/web-client-ui/compare/v0.81.2...v0.82.0) (2024-06-11)

### ⚠ BREAKING CHANGES

- Removed
  `TreeTableViewportUpdater`,`TableViewportUpdater`, and
  `StorageTableViewportUpdater`. If wanting to continue using them, copy
  the deleted files from this PR.

### Features

- Allow custom renderer to be passed into IrisGrid ([#2061](https://github.com/deephaven/web-client-ui/issues/2061)) ([41233b5](https://github.com/deephaven/web-client-ui/commit/41233b5f4ed49b8af63506ca5d2af6653ab5eb9c))

### Bug Fixes

- A few small cleanups for DateTimeInput ([#2062](https://github.com/deephaven/web-client-ui/issues/2062)) ([ec11736](https://github.com/deephaven/web-client-ui/commit/ec117365f17ac6c4635c5b73c28c9cc8bee10d84))
- Editing issues when key columns are not first columns ([#2053](https://github.com/deephaven/web-client-ui/issues/2053)) ([1bbcc73](https://github.com/deephaven/web-client-ui/commit/1bbcc73ddaa51502d8e14b2bffd3414998d6436a))
- Embed-widget with multiple panels not showing panel headers ([#2064](https://github.com/deephaven/web-client-ui/issues/2064)) ([3f45f07](https://github.com/deephaven/web-client-ui/commit/3f45f07afb2c18c5c2ff9a16e3c48f6ce0d70dda))
- Remove TreeTableViewportUpdater, TableViewportUpdater, and StorageTableViewportUpdater ([#2057](https://github.com/deephaven/web-client-ui/issues/2057)) ([0943041](https://github.com/deephaven/web-client-ui/commit/09430415ab91636b24c9388e87c0a45a1807aaeb))

## [0.81.2](https://github.com/deephaven/web-client-ui/compare/v0.81.1...v0.81.2) (2024-06-06)

**Note:** Version bump only for package @deephaven/web-client-ui

## [0.81.1](https://github.com/deephaven/web-client-ui/compare/v0.81.0...v0.81.1) (2024-06-04)

### Bug Fixes

- Exporting correct Radio prop types ([#2058](https://github.com/deephaven/web-client-ui/issues/2058)) ([98be05a](https://github.com/deephaven/web-client-ui/commit/98be05aa0897ac479ff13d26e7902f129ac9a749)), closes [40react-types/radio/src/index.d.ts#L58-L71](https://github.com/40react-types/radio/src/index.d.ts/issues/L58-L71) [#2020](https://github.com/deephaven/web-client-ui/issues/2020)

## [0.81.0](https://github.com/deephaven/web-client-ui/compare/v0.80.1...v0.81.0) (2024-06-04)

### Features

- DH-16737 Add ObjectManager, `useWidget` hook ([#2030](https://github.com/deephaven/web-client-ui/issues/2030)) ([#2056](https://github.com/deephaven/web-client-ui/issues/2056)) ([dbf613b](https://github.com/deephaven/web-client-ui/commit/dbf613b01507f85274e3a034a21151e746d4505c))

## [0.80.1](https://github.com/deephaven/web-client-ui/compare/v0.80.0...v0.80.1) (2024-06-04)

### Bug Fixes

- CSV Drag and Drop Console Error ([#2052](https://github.com/deephaven/web-client-ui/issues/2052)) ([85811dd](https://github.com/deephaven/web-client-ui/commit/85811dd64f1cb04fedc85d1f674ec90a2ea1556c))
- re-export Radio and RadioGroup prop types ([#2055](https://github.com/deephaven/web-client-ui/issues/2055)) ([06b9767](https://github.com/deephaven/web-client-ui/commit/06b976752d756db17a491645cebe79a7293ce132)), closes [#2020](https://github.com/deephaven/web-client-ui/issues/2020)

# [0.80.0](https://github.com/deephaven/web-client-ui/compare/v0.79.0...v0.80.0) (2024-06-03)

### Bug Fixes

- Console error when opening context menu on tree table ([#2047](https://github.com/deephaven/web-client-ui/issues/2047)) ([77bea7d](https://github.com/deephaven/web-client-ui/commit/77bea7d2badbc37eb3259a85873d6f900a07be14))
- DH-17076 LayoutHints on TreeTables were not being applied ([#2041](https://github.com/deephaven/web-client-ui/issues/2041)) ([2977dd2](https://github.com/deephaven/web-client-ui/commit/2977dd262ae4b8dcd82e4622fb6f61b6c4e7b06e)), closes [#2035](https://github.com/deephaven/web-client-ui/issues/2035)
- e2e - docker logs fix ([#2032](https://github.com/deephaven/web-client-ui/issues/2032)) ([297ad9a](https://github.com/deephaven/web-client-ui/commit/297ad9ab765ac7859479b7b8e531f1c88f8d82db)), closes [#2031](https://github.com/deephaven/web-client-ui/issues/2031)
- e2e test status reporting incorrectly ([#2045](https://github.com/deephaven/web-client-ui/issues/2045)) ([8e6b6da](https://github.com/deephaven/web-client-ui/commit/8e6b6da4a4ccfc9bc852318e16ea5f0c4d21bf64)), closes [#2044](https://github.com/deephaven/web-client-ui/issues/2044)

### Features

- Re-export Spectrum button and checkbox ([#2039](https://github.com/deephaven/web-client-ui/issues/2039)) ([0e22d11](https://github.com/deephaven/web-client-ui/commit/0e22d11a6da3f189530b2ce0c8751d44097db971))

# [0.79.0](https://github.com/deephaven/web-client-ui/compare/v0.78.0...v0.79.0) (2024-05-24)

### Bug Fixes

- Replace shortid package with nanoid package ([#2025](https://github.com/deephaven/web-client-ui/issues/2025)) ([30d9d3c](https://github.com/deephaven/web-client-ui/commit/30d9d3c1438a8a4d1f351d6f6f677f8ee7c22fbe))
- Unedited markdown widgets not persisting ([#2019](https://github.com/deephaven/web-client-ui/issues/2019)) ([c17f136](https://github.com/deephaven/web-client-ui/commit/c17f1367e3575f634b93f29ff3623b99db3c1f0d))

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

- "Delete Selected Rows" bug for tables with no key columns ([#1996](https://github.com/deephaven/web-client-ui/issues/1996)) ([37fe009](https://github.com/deephaven/web-client-ui/commit/37fe00914253822a56033bee49570e82caff9334))
- Improve the look of the error view ([#2001](https://github.com/deephaven/web-client-ui/issues/2001)) ([3236c9b](https://github.com/deephaven/web-client-ui/commit/3236c9b7acb53e9468f09c1e57a99d79bb953774))
- PouchStorageTable using incorrect $ne operator ([#2011](https://github.com/deephaven/web-client-ui/issues/2011)) ([6cf1240](https://github.com/deephaven/web-client-ui/commit/6cf124012a19b122b3a96f620886b970c12b6d29))
- Use picker for iris grid partition selector ([#2012](https://github.com/deephaven/web-client-ui/issues/2012)) ([b61c518](https://github.com/deephaven/web-client-ui/commit/b61c51840ae5f83dc00bf9dab0d1e6a7e4ba64d5))
- useViewportData - memoize subscriptions and first row of viewport ([#2008](https://github.com/deephaven/web-client-ui/issues/2008)) ([2246a4a](https://github.com/deephaven/web-client-ui/commit/2246a4a1ef087db060f2130c5a2d7c1e037746b4)), closes [#2003](https://github.com/deephaven/web-client-ui/issues/2003) [#1928](https://github.com/deephaven/web-client-ui/issues/1928)

### Code Refactoring

- Rename `ButtonGroup` to `SplitButtonGroup` ([#1997](https://github.com/deephaven/web-client-ui/issues/1997)) ([95a589c](https://github.com/deephaven/web-client-ui/commit/95a589ca4b471e2c357e8fcaf6c9e1f4581a5231))

### Features

- Add JS Plugin Information ([#2002](https://github.com/deephaven/web-client-ui/issues/2002)) ([6ff378c](https://github.com/deephaven/web-client-ui/commit/6ff378cf5c47382e5e7d48e086c5554c4ea4560f))
- add middle click dashboard tab deletion ([#1992](https://github.com/deephaven/web-client-ui/issues/1992)) ([c922f87](https://github.com/deephaven/web-client-ui/commit/c922f87941858466e90802f4171104129284037b)), closes [#1990](https://github.com/deephaven/web-client-ui/issues/1990)
- ListView actions ([#1968](https://github.com/deephaven/web-client-ui/issues/1968)) ([8e325ec](https://github.com/deephaven/web-client-ui/commit/8e325ec30e68d612e8d696d0c6fec193a8c4ebdd))
- Make grid widget respect global formatter settings ([#1995](https://github.com/deephaven/web-client-ui/issues/1995)) ([d1fba8f](https://github.com/deephaven/web-client-ui/commit/d1fba8f664e1b33e492ddd9fe68d50545a08a3f9))
- update @vscode/codicons to 0.36 ([#2010](https://github.com/deephaven/web-client-ui/issues/2010)) ([3a6a439](https://github.com/deephaven/web-client-ui/commit/3a6a439c80054e6b92440690ee5e9762f6e691d4))

### Performance Improvements

- Improve performance of lots of grids in a dashboard ([#1987](https://github.com/deephaven/web-client-ui/issues/1987)) ([3de52d6](https://github.com/deephaven/web-client-ui/commit/3de52d6fa0512792c97928f65f0b4b1080da2c49))

### BREAKING CHANGES

- Renamed @deephaven/components `ButtonGroup` to
  `SplitButtonGroup`

# [0.77.0](https://github.com/deephaven/web-client-ui/compare/v0.76.0...v0.77.0) (2024-05-07)

### Bug Fixes

- Added `getKey` to `SelectionUtils.optimizeSelection` ([#1994](https://github.com/deephaven/web-client-ui/issues/1994)) ([4404894](https://github.com/deephaven/web-client-ui/commit/440489437de62b1e57cdbb7a85adeff97969f7f2))

### BREAKING CHANGES

- @deephaven/react-hooks:
  `SelectionUtils.optimizeSelection` and `useMappedSelection` require
  additional `getKey` arg

# [0.76.0](https://github.com/deephaven/web-client-ui/compare/v0.75.1...v0.76.0) (2024-05-03)

### Bug Fixes

- Fixed ListView props ([#1986](https://github.com/deephaven/web-client-ui/issues/1986)) ([0ca3a66](https://github.com/deephaven/web-client-ui/commit/0ca3a66bb090d4ce3a7e05bf53154eb86b367e8d))
- remove extra padding on column statistic refresh button ([#1984](https://github.com/deephaven/web-client-ui/issues/1984)) ([dc29aa9](https://github.com/deephaven/web-client-ui/commit/dc29aa92de83f1aedeeb787ce89ed442d3536867))
- Typing in notebooks is laggy ([#1977](https://github.com/deephaven/web-client-ui/issues/1977)) ([47f9a57](https://github.com/deephaven/web-client-ui/commit/47f9a571e725311e429f703fd5332971a1f74f1a))

### Performance Improvements

- remove focus tracking in notebook panel causing extra re-render ([#1983](https://github.com/deephaven/web-client-ui/issues/1983)) ([a283e13](https://github.com/deephaven/web-client-ui/commit/a283e13fafe1ecb156985fab00ba15344f180ff4))
- remove workspace dependancy from iris-grid-panel and memoize settings redux selector ([#1982](https://github.com/deephaven/web-client-ui/issues/1982)) ([c3ea867](https://github.com/deephaven/web-client-ui/commit/c3ea86709f0a184065dd346d71d6525ed881e465)), closes [#1977](https://github.com/deephaven/web-client-ui/issues/1977)

### BREAKING CHANGES

- getPluginContent deprecatedProps have been removed from
  iris-grid

## [0.75.1](https://github.com/deephaven/web-client-ui/compare/v0.75.0...v0.75.1) (2024-05-02)

### Performance Improvements

- Use `fast-deep-equal` instead of `deep-equal ([#1979](https://github.com/deephaven/web-client-ui/issues/1979)) ([3f3de9f](https://github.com/deephaven/web-client-ui/commit/3f3de9fd6a150f59cf6bf8e08eb1c11f0d9d93e1))

# [0.75.0](https://github.com/deephaven/web-client-ui/compare/v0.74.0...v0.75.0) (2024-05-01)

### Bug Fixes

- change fira source ([#1944](https://github.com/deephaven/web-client-ui/issues/1944)) ([07e5a26](https://github.com/deephaven/web-client-ui/commit/07e5a268fd5c4df6e24359266008c24c4c25d2a9)), closes [#1902](https://github.com/deephaven/web-client-ui/issues/1902)
- Fix null partition filter ([#1954](https://github.com/deephaven/web-client-ui/issues/1954)) ([3a1f92b](https://github.com/deephaven/web-client-ui/commit/3a1f92be1183adf99b7b6a553684533cc9fab9d7)), closes [#1867](https://github.com/deephaven/web-client-ui/issues/1867)

### Features

- context menu reopen for stack only ([#1932](https://github.com/deephaven/web-client-ui/issues/1932)) ([6a9a6a4](https://github.com/deephaven/web-client-ui/commit/6a9a6a4d4f09fd0723456b45a3dab1603e181f7c)), closes [#1931](https://github.com/deephaven/web-client-ui/issues/1931)
- Create an ErrorView that can be used to display errors ([#1965](https://github.com/deephaven/web-client-ui/issues/1965)) ([65ef1a7](https://github.com/deephaven/web-client-ui/commit/65ef1a79bb2b098e1d64046447794ba23b5a65c8))
- ListView + Picker - Item icon support ([#1959](https://github.com/deephaven/web-client-ui/issues/1959)) ([cb13c60](https://github.com/deephaven/web-client-ui/commit/cb13c6094f2f416e7682da67fde9fc05f68b9b17)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890)
- Picker - initial scroll position ([#1942](https://github.com/deephaven/web-client-ui/issues/1942)) ([5f49761](https://github.com/deephaven/web-client-ui/commit/5f4976115bfc016e6d9cbe9fd77413c3fd8f8353)), closes [#1890](https://github.com/deephaven/web-client-ui/issues/1890) [#1935](https://github.com/deephaven/web-client-ui/issues/1935)

# [0.74.0](https://github.com/deephaven/web-client-ui/compare/v0.73.0...v0.74.0) (2024-04-24)

### Bug Fixes

- unable to select deselected leaf ([#1956](https://github.com/deephaven/web-client-ui/issues/1956)) ([f5d622a](https://github.com/deephaven/web-client-ui/commit/f5d622a2170f30cb30eecf2bbdac97b23c1f8058)), closes [#1856](https://github.com/deephaven/web-client-ui/issues/1856)

### Features

- Add DashboardPlugin support to embed-widget ([#1950](https://github.com/deephaven/web-client-ui/issues/1950)) ([27fc8bd](https://github.com/deephaven/web-client-ui/commit/27fc8bd49debf7b37fed9e91cbaf784c9ebb9347))
- replace code studio home icon with "Code Studio" as label ([#1951](https://github.com/deephaven/web-client-ui/issues/1951)) ([111ea64](https://github.com/deephaven/web-client-ui/commit/111ea64c675190995f85789ce57ea055b8b7fd2b)), closes [#1794](https://github.com/deephaven/web-client-ui/issues/1794)

# [0.73.0](https://github.com/deephaven/web-client-ui/compare/v0.72.0...v0.73.0) (2024-04-19)

### Bug Fixes

- allow plotly plots to shrink inside ui.flex/grid layouts ([#1946](https://github.com/deephaven/web-client-ui/issues/1946)) ([88fbe86](https://github.com/deephaven/web-client-ui/commit/88fbe86f819a446228ef47dcc117888af908f98c))
- Fix issues when auto-size columns/rows is false, and when row headers are not 0 ([#1927](https://github.com/deephaven/web-client-ui/issues/1927)) ([01c2a06](https://github.com/deephaven/web-client-ui/commit/01c2a064f287638382f0f7fe474098393b73b9ca))

### Features

- improve table loading ([#1898](https://github.com/deephaven/web-client-ui/issues/1898)) ([9b14ee0](https://github.com/deephaven/web-client-ui/commit/9b14ee0958150ac928af52ad6c58eff9761d1b2b)), closes [#1865](https://github.com/deephaven/web-client-ui/issues/1865)
- ListView components ([#1919](https://github.com/deephaven/web-client-ui/issues/1919)) ([b63ab18](https://github.com/deephaven/web-client-ui/commit/b63ab18033d1a8c218ad4cb7eccc252457c1d8d2))
- log export blacklist ([#1881](https://github.com/deephaven/web-client-ui/issues/1881)) ([d3fb28a](https://github.com/deephaven/web-client-ui/commit/d3fb28aeed55cdda005d5fa5dd3e4cb146faacdf)), closes [#1245](https://github.com/deephaven/web-client-ui/issues/1245)
- New chart error panel ([#1850](https://github.com/deephaven/web-client-ui/issues/1850)) ([309ff79](https://github.com/deephaven/web-client-ui/commit/309ff795dcb367fc9b7b6f2abb4a07b10cf8ab55)), closes [#1520](https://github.com/deephaven/web-client-ui/issues/1520)
- reopen closed tabs ([#1912](https://github.com/deephaven/web-client-ui/issues/1912)) ([c2e8714](https://github.com/deephaven/web-client-ui/commit/c2e8714c8728d414ec799277a68dc2675d330a11)), closes [#1785](https://github.com/deephaven/web-client-ui/issues/1785)

### BREAKING CHANGES

- `LIST_VIEW_ROW_HEIGHT` number constant replaced with
  dictionary `LIST_VIEW_ROW_HEIGHTS`

# [0.72.0](https://github.com/deephaven/web-client-ui/compare/v0.71.0...v0.72.0) (2024-04-04)

### Bug Fixes

- Add isInvalid prop to Select component ([#1883](https://github.com/deephaven/web-client-ui/issues/1883)) ([1803f31](https://github.com/deephaven/web-client-ui/commit/1803f31db3f0b5d2af2baf2931f47edb037c530e)), closes [#1882](https://github.com/deephaven/web-client-ui/issues/1882)
- adjust alignment of search input next/previous buttons ([#1917](https://github.com/deephaven/web-client-ui/issues/1917)) ([c7fcd38](https://github.com/deephaven/web-client-ui/commit/c7fcd38d41d27d7ff3cc32222b16b44412611b71))
- Dashboard onLayoutInitialized not firing if config is empty ([#1914](https://github.com/deephaven/web-client-ui/issues/1914)) ([84c648b](https://github.com/deephaven/web-client-ui/commit/84c648b74808d7aa9f3cb702e44e9a9ebc561c41))
- package-lock missing pinned dependency ([#1920](https://github.com/deephaven/web-client-ui/issues/1920)) ([1d9d216](https://github.com/deephaven/web-client-ui/commit/1d9d216ebaa32c1c1c26992bd9d28a71fbce20d0))

### Code Refactoring

- Change embed-grid and embed-chart to redirects ([#1873](https://github.com/deephaven/web-client-ui/issues/1873)) ([e17619a](https://github.com/deephaven/web-client-ui/commit/e17619a703fb621a091211820c7f7eedfe3b9f8e))

### Features

- Picker - formatter settings ([#1907](https://github.com/deephaven/web-client-ui/issues/1907)) ([f06a141](https://github.com/deephaven/web-client-ui/commit/f06a141a611e1a86c9b6dcbff963d61e3bee7010)), closes [#1889](https://github.com/deephaven/web-client-ui/issues/1889)
- re-export spectrum useStyleProp util ([#1916](https://github.com/deephaven/web-client-ui/issues/1916)) ([aafa14b](https://github.com/deephaven/web-client-ui/commit/aafa14b12e273c82f0df69d8d7b322c7fc8bff6c))
- wrap spectrum View, Text and Heading to accept custom colors ([#1903](https://github.com/deephaven/web-client-ui/issues/1903)) ([a03fa07](https://github.com/deephaven/web-client-ui/commit/a03fa0796e8a5a665d0badbd8380995567b0d6dc))

### BREAKING CHANGES

- `@deephaven/embed-grid` does not handle messages to the
  iframe for filtering or sorting the grid any more

# [0.71.0](https://github.com/deephaven/web-client-ui/compare/v0.70.0...v0.71.0) (2024-03-28)

### Bug Fixes

- Fixed re-export ([#1894](https://github.com/deephaven/web-client-ui/issues/1894)) ([#1895](https://github.com/deephaven/web-client-ui/issues/1895)) ([b49b506](https://github.com/deephaven/web-client-ui/commit/b49b5069d637ac136578ce839d9fc0416f468adf))
- Invalid migration of legacy partitions ([#1892](https://github.com/deephaven/web-client-ui/issues/1892)) ([96298f6](https://github.com/deephaven/web-client-ui/commit/96298f6d9c0de44c73f0965eba2055997d17a2fa))

### Features

- Change autoclosing bracket behavior to beforeWhitespace ([#1905](https://github.com/deephaven/web-client-ui/issues/1905)) ([80207f4](https://github.com/deephaven/web-client-ui/commit/80207f4178aa4a524de70644a715e1f030b5122d))
- Picker - Table support for key + label columns ([#1876](https://github.com/deephaven/web-client-ui/issues/1876)) ([bfbf7b1](https://github.com/deephaven/web-client-ui/commit/bfbf7b128f0be0a82c7dd33e9023ff7df3f480fc)), closes [#1858](https://github.com/deephaven/web-client-ui/issues/1858)

# [0.70.0](https://github.com/deephaven/web-client-ui/compare/v0.69.1...v0.70.0) (2024-03-22)

### chore

- Delete ValidateLabelInput ([#1887](https://github.com/deephaven/web-client-ui/issues/1887)) ([5d6ebe9](https://github.com/deephaven/web-client-ui/commit/5d6ebe92d91f39c1a2343721f5a4f53a6e02f3a5))

### Features

- Re-export Spectrum components + prop types ([#1880](https://github.com/deephaven/web-client-ui/issues/1880)) ([4783092](https://github.com/deephaven/web-client-ui/commit/478309289f727c560ae92722c96fed964ba98d9d)), closes [#1852](https://github.com/deephaven/web-client-ui/issues/1852)

### BREAKING CHANGES

- ValidateLabelInput is no longer included in the
  `@deephaven/components` package.

## [0.69.1](https://github.com/deephaven/web-client-ui/compare/v0.69.0...v0.69.1) (2024-03-15)

### Bug Fixes

- Loading workspace plugin data ([#1872](https://github.com/deephaven/web-client-ui/issues/1872)) ([1def969](https://github.com/deephaven/web-client-ui/commit/1def969d81b4209df1e06cd99c0d5afc71d14844))

# [0.69.0](https://github.com/deephaven/web-client-ui/compare/v0.68.0...v0.69.0) (2024-03-15)

### Bug Fixes

- Save/load plugin data with layout ([#1866](https://github.com/deephaven/web-client-ui/issues/1866)) ([e64407d](https://github.com/deephaven/web-client-ui/commit/e64407d8e5c162bd3de07b84257a15e3330f415e)), closes [#1861](https://github.com/deephaven/web-client-ui/issues/1861)
- swap goto tooltips ([#1860](https://github.com/deephaven/web-client-ui/issues/1860)) ([6236b47](https://github.com/deephaven/web-client-ui/commit/6236b477cfbc79ab9ef92dd120fefe52e0fd9b55)), closes [#1826](https://github.com/deephaven/web-client-ui/issues/1826)

### Features

- expose spectrum `Flex` component as wrapped deephaven component ([#1869](https://github.com/deephaven/web-client-ui/issues/1869)) ([5e71488](https://github.com/deephaven/web-client-ui/commit/5e71488d142b4d2b427bc0b81d17a0f538b09c26))

# [0.68.0](https://github.com/deephaven/web-client-ui/compare/v0.67.0...v0.68.0) (2024-03-08)

### Bug Fixes

- Do not show Group column for tree-tables ([#1851](https://github.com/deephaven/web-client-ui/issues/1851)) ([1ce6aac](https://github.com/deephaven/web-client-ui/commit/1ce6aac82071303fdbed064e8b71b54f741d0a87)), closes [#1831](https://github.com/deephaven/web-client-ui/issues/1831) [#1853](https://github.com/deephaven/web-client-ui/issues/1853)
- hide expand all when not available ([#1854](https://github.com/deephaven/web-client-ui/issues/1854)) ([aa34ace](https://github.com/deephaven/web-client-ui/commit/aa34ace66982047113a5d29b1840d946b1a04399)), closes [#1822](https://github.com/deephaven/web-client-ui/issues/1822)

### Features

- Add support to pass in mouseHandlers into IrisGrid ([#1857](https://github.com/deephaven/web-client-ui/issues/1857)) ([acf32a6](https://github.com/deephaven/web-client-ui/commit/acf32a6d014b9b7cd8d1b10f08145992c6a589fd))
- Picker - Item description support ([#1855](https://github.com/deephaven/web-client-ui/issues/1855)) ([026c101](https://github.com/deephaven/web-client-ui/commit/026c1018e6cbac485182d89d4dcc20f2e7e6e54c))

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

### Bug Fixes

- Update plotly to v2.29, resolve some rendering issues ([#1806](https://github.com/deephaven/web-client-ui/issues/1806)) ([8892074](https://github.com/deephaven/web-client-ui/commit/8892074da397f677b5556cd1161dcff8e41fcd9c))

### Features

- Added section support to Picker ([#1847](https://github.com/deephaven/web-client-ui/issues/1847)) ([1381ee7](https://github.com/deephaven/web-client-ui/commit/1381ee7f79ab493922a7fd3daa9d43ee6791547f))
- Plugin loader should prioritize new plugin format, when available ([#1846](https://github.com/deephaven/web-client-ui/issues/1846)) ([c6ef5b3](https://github.com/deephaven/web-client-ui/commit/c6ef5b37efbbea6cd8b8a8fd3597b99827d59284))

## [0.66.1](https://github.com/deephaven/web-client-ui/compare/v0.66.0...v0.66.1) (2024-02-28)

### Bug Fixes

- Load default dashboard data from workspace data ([#1810](https://github.com/deephaven/web-client-ui/issues/1810)) ([6dd9814](https://github.com/deephaven/web-client-ui/commit/6dd9814d5dde7928c3ad765ce8a0e25f770c1871)), closes [#1746](https://github.com/deephaven/web-client-ui/issues/1746)
- Spectrum actionbar selector ([#1841](https://github.com/deephaven/web-client-ui/issues/1841)) ([67de0e0](https://github.com/deephaven/web-client-ui/commit/67de0e09d11ba340aa546be71c400852a5a2092c))

# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

### Bug Fixes

- Fixed svg url ([#1839](https://github.com/deephaven/web-client-ui/issues/1839)) ([63fe035](https://github.com/deephaven/web-client-ui/commit/63fe0354df2df40e318aa1738ff2bb916c0aea8e)), closes [#1838](https://github.com/deephaven/web-client-ui/issues/1838)
- keep active cell selection in first column from going offscreen ([#1823](https://github.com/deephaven/web-client-ui/issues/1823)) ([69e8cdd](https://github.com/deephaven/web-client-ui/commit/69e8cdd1d138c661ed56bbd5e03e31713e8113a4))
- spectrum textfield validation icon position with set content-box ([#1825](https://github.com/deephaven/web-client-ui/issues/1825)) ([8d95212](https://github.com/deephaven/web-client-ui/commit/8d952125009ddc4e4039833be4a80404d82ed7d7))

### Features

- exposes editor-line-number-active-fg theme variable ([#1833](https://github.com/deephaven/web-client-ui/issues/1833)) ([448f0f0](https://github.com/deephaven/web-client-ui/commit/448f0f0d5bf99be14845e3f6b0e063f55a8de775))
- Lazy loading and code splitting ([#1802](https://github.com/deephaven/web-client-ui/issues/1802)) ([25d1c09](https://github.com/deephaven/web-client-ui/commit/25d1c09b2f55f9f10eff5918501d385554f237e6))
- Picker Component ([#1821](https://github.com/deephaven/web-client-ui/issues/1821)) ([e50f0f6](https://github.com/deephaven/web-client-ui/commit/e50f0f6c0402717f1bb8adb8a08a217a0f8d1f45))

### BREAKING CHANGES

- the duplicate `spectrum-Textfield-validationIcon` css
  in DHE should be removed

# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)

### Bug Fixes

- inline blocks throw error in md notebook ([#1820](https://github.com/deephaven/web-client-ui/issues/1820)) ([f871323](https://github.com/deephaven/web-client-ui/commit/f871323a069a160cae69e1f5722464bb5be604b5)), closes [#1817](https://github.com/deephaven/web-client-ui/issues/1817)

### Features

- Test Utils - Generate exhaustive boolean combinations and MockProxy spread ([#1811](https://github.com/deephaven/web-client-ui/issues/1811)) ([0a2f054](https://github.com/deephaven/web-client-ui/commit/0a2f054591d04dd32c4919ce90fd538638e0b563)), closes [#1809](https://github.com/deephaven/web-client-ui/issues/1809)
- useDelay hook ([#1808](https://github.com/deephaven/web-client-ui/issues/1808)) ([445f9fe](https://github.com/deephaven/web-client-ui/commit/445f9fefc3c403f1b43031238d453105a3d1cc45)), closes [#1807](https://github.com/deephaven/web-client-ui/issues/1807)

# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

### Bug Fixes

- address chrome 121 scrollbar style behaviour change ([#1787](https://github.com/deephaven/web-client-ui/issues/1787)) ([fa3a33d](https://github.com/deephaven/web-client-ui/commit/fa3a33d18ccf0b3c011088b77ffb625237aa6836))
- Bind this to utils that moved from static to non-static with js api de-globalization ([#1795](https://github.com/deephaven/web-client-ui/issues/1795)) ([d137ee7](https://github.com/deephaven/web-client-ui/commit/d137ee7d33ac0b0babd3336624b5db608eca44ba))

### Features

- add LaTeX to Markdown ([#1734](https://github.com/deephaven/web-client-ui/issues/1734)) ([434930a](https://github.com/deephaven/web-client-ui/commit/434930af3e30fceab4e4dc193f29016522799cb1)), closes [#1720](https://github.com/deephaven/web-client-ui/issues/1720)
- Chart responsible for its own theme ([#1772](https://github.com/deephaven/web-client-ui/issues/1772)) ([fabb055](https://github.com/deephaven/web-client-ui/commit/fabb055f9dacdbb4ad1b4ce7ca85d170f955366d)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)
- toggle empty/null rendering ([#1778](https://github.com/deephaven/web-client-ui/issues/1778)) ([ae94f1b](https://github.com/deephaven/web-client-ui/commit/ae94f1beeaa9224264dc93231164401f89673ebc)), closes [#1646](https://github.com/deephaven/web-client-ui/issues/1646)

### BREAKING CHANGES

- - Renamed `ColorUtils.getColorwayFromTheme` to `normalizeColorway`

* Removed `chartTheme` arg from functions in `ChartUtils`,
  `ChartModelFactory` and `FigureChartModel` in @deephaven/chart

# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)

### Bug Fixes

- adjust theme notice and info colors ([#1779](https://github.com/deephaven/web-client-ui/issues/1779)) ([8930522](https://github.com/deephaven/web-client-ui/commit/893052295861cfca13e445abe61b3ac4aa55af61))
- DH-16461: Preload --dh-color-text-highlight ([#1780](https://github.com/deephaven/web-client-ui/issues/1780)) ([#1781](https://github.com/deephaven/web-client-ui/issues/1781)) ([f7989b6](https://github.com/deephaven/web-client-ui/commit/f7989b6054e5301276f5b94e5ee1e8f5f73ca6a1))
- DH-16463: isEqual returns false for layouts with undefined and missing props in panelState ([#1783](https://github.com/deephaven/web-client-ui/issues/1783)) ([e90b627](https://github.com/deephaven/web-client-ui/commit/e90b627fed2c76b81ee96006abef14942388f3cc))
- show copy cursor in grid on key down and not just mouse move ([#1735](https://github.com/deephaven/web-client-ui/issues/1735)) ([0781900](https://github.com/deephaven/web-client-ui/commit/0781900109439be8e0bca55f02665d2005df2136))
- sorting frozen columns ([#1749](https://github.com/deephaven/web-client-ui/issues/1749)) ([51e60c5](https://github.com/deephaven/web-client-ui/commit/51e60c5cc1bcdb5fb4e6ed74ad42d8b9507ff312)), closes [#1645](https://github.com/deephaven/web-client-ui/issues/1645)

### Features

- always show close button on the active panel in a stack ([#1773](https://github.com/deephaven/web-client-ui/issues/1773)) ([33c6a8d](https://github.com/deephaven/web-client-ui/commit/33c6a8d39c17fb60d291ce4be9a77bbad16b4e65))
- disable "Changes you made may not be saved." prompt in dev mode ([#1775](https://github.com/deephaven/web-client-ui/issues/1775)) ([6b0dce1](https://github.com/deephaven/web-client-ui/commit/6b0dce168df01df02219f64dbd6f9b73eec1fb2a))
- multiselect values ([#1736](https://github.com/deephaven/web-client-ui/issues/1736)) ([e6955c1](https://github.com/deephaven/web-client-ui/commit/e6955c1b330ae09d3bfbe3bbcb6d1bf303ea9b48)), closes [#1233](https://github.com/deephaven/web-client-ui/issues/1233)

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

### Bug Fixes

- apply theme accent color scale and other small tweaks ([#1768](https://github.com/deephaven/web-client-ui/issues/1768)) ([1e631a4](https://github.com/deephaven/web-client-ui/commit/1e631a470bff851f8c0d4401a43bc08d0c974391))
- Load full uncoalesced table if no partition columns available ([#1767](https://github.com/deephaven/web-client-ui/issues/1767)) ([e6dd3e1](https://github.com/deephaven/web-client-ui/commit/e6dd3e16a6018bfa0a11321d807015ce97f692fd)), closes [#1763](https://github.com/deephaven/web-client-ui/issues/1763)
- Made some plugin types generic ([#1769](https://github.com/deephaven/web-client-ui/issues/1769)) ([ac40c6f](https://github.com/deephaven/web-client-ui/commit/ac40c6f4c0e75c34689c964c2614017d50e74d74)), closes [#1759](https://github.com/deephaven/web-client-ui/issues/1759)

# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)

### Bug Fixes

- Made WidgetComponentProps generic ([#1760](https://github.com/deephaven/web-client-ui/issues/1760)) ([8cb0a10](https://github.com/deephaven/web-client-ui/commit/8cb0a10f796978fdf364c5f046ac60bf32eae6f5)), closes [#1759](https://github.com/deephaven/web-client-ui/issues/1759)
- missing react key on settings menu fragment ([#1757](https://github.com/deephaven/web-client-ui/issues/1757)) ([b14b714](https://github.com/deephaven/web-client-ui/commit/b14b714a7573ed4a3585b2e65334b57f9870b1ad))

### Features

- Added dashboard-core-plugins to remote-component list ([#1762](https://github.com/deephaven/web-client-ui/issues/1762)) ([3194c4b](https://github.com/deephaven/web-client-ui/commit/3194c4b43264adbbd0ab02ef9461de590ca31797)), closes [#1728](https://github.com/deephaven/web-client-ui/issues/1728)
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

- Fix useDeferredApi export ([#1742](https://github.com/deephaven/web-client-ui/issues/1742)) ([af5f5f4](https://github.com/deephaven/web-client-ui/commit/af5f5f45c035fb0e2a9ca4c07a65070cbbd0ad0c))
- Handle undefined DashboardData props ([#1726](https://github.com/deephaven/web-client-ui/issues/1726)) ([45fa929](https://github.com/deephaven/web-client-ui/commit/45fa929586c0b13a738eceaa064b261eecbd8308)), closes [#1684](https://github.com/deephaven/web-client-ui/issues/1684) [#1685](https://github.com/deephaven/web-client-ui/issues/1685)
- hcm caret shouldn't be allowed to shrink ([#1733](https://github.com/deephaven/web-client-ui/issues/1733)) ([6547814](https://github.com/deephaven/web-client-ui/commit/65478140934157c7c5bcf27ea89151255fb18a52)), closes [deephaven-ent/iris#1274](https://github.com/deephaven-ent/iris/issues/1274)
- keep manually entered value in GoToRow when changing to same column type ([#1743](https://github.com/deephaven/web-client-ui/issues/1743)) ([689a1e2](https://github.com/deephaven/web-client-ui/commit/689a1e2fda9a9dd9e50ae200b0ad0f2b69b1bdbc)), closes [#1562](https://github.com/deephaven/web-client-ui/issues/1562)
- loading spinner finishes before all series load ([#1729](https://github.com/deephaven/web-client-ui/issues/1729)) ([e79297b](https://github.com/deephaven/web-client-ui/commit/e79297b213dbf3e615bae9024323efb45c29cda3)), closes [#1654](https://github.com/deephaven/web-client-ui/issues/1654)

### Features

- Add pluginDataMap to redux, add useDashboardPluginData hook ([#1737](https://github.com/deephaven/web-client-ui/issues/1737)) ([e1b4562](https://github.com/deephaven/web-client-ui/commit/e1b4562585fd6ea07efe085fe7ae5128a689ce37))
- added shortcut for copying version info and added browser/os to info ([#1739](https://github.com/deephaven/web-client-ui/issues/1739)) ([3312133](https://github.com/deephaven/web-client-ui/commit/3312133c902ed4a5ca110296ca36311fde9c1056))
- Adds icons dhUnderline and dhStrikethrough ([#1732](https://github.com/deephaven/web-client-ui/issues/1732)) ([c6a099d](https://github.com/deephaven/web-client-ui/commit/c6a099d84e8f474d4d418b631f45233bd874483f)), closes [#1715](https://github.com/deephaven/web-client-ui/issues/1715)
- adjust display of theme palette in styleguide ([#1745](https://github.com/deephaven/web-client-ui/issues/1745)) ([0ab0c93](https://github.com/deephaven/web-client-ui/commit/0ab0c936baaee9effc08d4d9e8d6cc3ba60f9c97))
- Create UI to Display Partitioned Tables ([#1663](https://github.com/deephaven/web-client-ui/issues/1663)) ([db219ca](https://github.com/deephaven/web-client-ui/commit/db219ca66bd087d4b5ddb58b667de96deee97760)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143)
- Default Plotly map colors ([#1721](https://github.com/deephaven/web-client-ui/issues/1721)) ([e8b9f12](https://github.com/deephaven/web-client-ui/commit/e8b9f121afaeb2c3dd6484a05ca1966a1d769260))
- double-clicking grid rows should select the row rather than toggle selection twice ([#1740](https://github.com/deephaven/web-client-ui/issues/1740)) ([f892e97](https://github.com/deephaven/web-client-ui/commit/f892e9764b596dae6bb33773d309c74bf1978470)), closes [#1704](https://github.com/deephaven/web-client-ui/issues/1704)
- Multiple dashboards ([#1714](https://github.com/deephaven/web-client-ui/issues/1714)) ([32dde3c](https://github.com/deephaven/web-client-ui/commit/32dde3c57765593889216cd3e27d1740ff357af1)), closes [#1683](https://github.com/deephaven/web-client-ui/issues/1683)

# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

### Bug Fixes

- GoToRow timestamp fails when selected row is out of view ([#1717](https://github.com/deephaven/web-client-ui/issues/1717)) ([9ddc973](https://github.com/deephaven/web-client-ui/commit/9ddc973108a6cc88999003c2d0dc6b48044967cc)), closes [#1561](https://github.com/deephaven/web-client-ui/issues/1561)
- Interface for IrisGridTableModelTemplate.backgroundColorForCell ([#1699](https://github.com/deephaven/web-client-ui/issues/1699)) ([73e1837](https://github.com/deephaven/web-client-ui/commit/73e1837eb2fdb161779724a8b275f4d8147b95c0)), closes [#1697](https://github.com/deephaven/web-client-ui/issues/1697)
- Moved logos so they show in production build ([#1713](https://github.com/deephaven/web-client-ui/issues/1713)) ([a3bea73](https://github.com/deephaven/web-client-ui/commit/a3bea733b97dfafe33a54623ef8e8e04cb5aa44e)), closes [#1712](https://github.com/deephaven/web-client-ui/issues/1712)
- re-colorize command codeblocks when theme changes ([#1731](https://github.com/deephaven/web-client-ui/issues/1731)) ([b1e42f5](https://github.com/deephaven/web-client-ui/commit/b1e42f58df5c9c478ff47d4823b517e23a94709f))
- TimeInput not triggering onChange on incomplete values ([#1711](https://github.com/deephaven/web-client-ui/issues/1711)) ([6894d96](https://github.com/deephaven/web-client-ui/commit/6894d96f921f57f0abb108bc2f3d8d86e9fa3c56)), closes [#1710](https://github.com/deephaven/web-client-ui/issues/1710)

### Features

- Action button tooltips ([#1706](https://github.com/deephaven/web-client-ui/issues/1706)) ([bff6bf9](https://github.com/deephaven/web-client-ui/commit/bff6bf91b938bbba7f7649ac671d2e4447ea3439)), closes [#1705](https://github.com/deephaven/web-client-ui/issues/1705)
- Add support for useDeferredApi ([#1725](https://github.com/deephaven/web-client-ui/issues/1725)) ([51ebe1b](https://github.com/deephaven/web-client-ui/commit/51ebe1bbf4da7bda1cc7b59da34aec88b3abc623))
- Improved preload variable handling ([#1723](https://github.com/deephaven/web-client-ui/issues/1723)) ([ed41c42](https://github.com/deephaven/web-client-ui/commit/ed41c424de75fcba8751a70b54a189957f979e97)), closes [#1695](https://github.com/deephaven/web-client-ui/issues/1695) [#1679](https://github.com/deephaven/web-client-ui/issues/1679)
- NavTabList component ([#1698](https://github.com/deephaven/web-client-ui/issues/1698)) ([96641fb](https://github.com/deephaven/web-client-ui/commit/96641fbc2f5f5ee291da15e464e80183d5107a57))
- Reject promise immediately if var not found ([#1718](https://github.com/deephaven/web-client-ui/issues/1718)) ([43d40bd](https://github.com/deephaven/web-client-ui/commit/43d40bd7962bf60ae692fdd47282d278d54b3f2b)), closes [#1701](https://github.com/deephaven/web-client-ui/issues/1701)
- theming tweaks ([#1727](https://github.com/deephaven/web-client-ui/issues/1727)) ([f919a7e](https://github.com/deephaven/web-client-ui/commit/f919a7ed333777e83ae6b0e3973991d2cf089359))

### BREAKING CHANGES

- - Subclasses of IrisGridTableModelTemplate or it's subclasses that use
    backgroundColorForCell may need to update their signature to accept the
    theme if they are calling the superclass

# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

### Bug Fixes

- `figure_title` and `chart_title` were not mapped up correctly ([#1676](https://github.com/deephaven/web-client-ui/issues/1676)) ([73e0b65](https://github.com/deephaven/web-client-ui/commit/73e0b658edffc7ef89b3b786f3fe30c0e64c96f9)), closes [#1674](https://github.com/deephaven/web-client-ui/issues/1674) [#1675](https://github.com/deephaven/web-client-ui/issues/1675)

### Features

- "Group" column for rollup/tree tables ([#1636](https://github.com/deephaven/web-client-ui/issues/1636)) ([ba1d51b](https://github.com/deephaven/web-client-ui/commit/ba1d51baf20d5426746243ed0022848747dc44f8)), closes [#1555](https://github.com/deephaven/web-client-ui/issues/1555)
- Add alt+click shortcut to copy cell and column headers ([#1694](https://github.com/deephaven/web-client-ui/issues/1694)) ([4a8a81a](https://github.com/deephaven/web-client-ui/commit/4a8a81a3185af45a265c2e7b489e4a40180c66c0)), closes [deephaven/web-client-ui#1585](https://github.com/deephaven/web-client-ui/issues/1585)
- Theming - Spectrum variable mapping and light theme ([#1680](https://github.com/deephaven/web-client-ui/issues/1680)) ([2278697](https://github.com/deephaven/web-client-ui/commit/2278697b8c0f62f4294c261f6f6de608fea3d2d5)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669) [#1539](https://github.com/deephaven/web-client-ui/issues/1539)

## [0.57.1](https://github.com/deephaven/web-client-ui/compare/v0.57.0...v0.57.1) (2023-12-14)

### Bug Fixes

- Bootstrap mixins ([#1692](https://github.com/deephaven/web-client-ui/issues/1692)) ([3934431](https://github.com/deephaven/web-client-ui/commit/3934431c0fbb440eff9017356d033394666cf7a1)), closes [#1693](https://github.com/deephaven/web-client-ui/issues/1693)

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)

### Bug Fixes

- Made selector return types generic ([#1688](https://github.com/deephaven/web-client-ui/issues/1688)) ([b2972f0](https://github.com/deephaven/web-client-ui/commit/b2972f0dbf9e662eec6326acc6855aa1ddc85c41)), closes [#1687](https://github.com/deephaven/web-client-ui/issues/1687)

### Features

- Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)

# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)

### Bug Fixes

- add right margin to <Button kind='inline'/> using icons ([#1664](https://github.com/deephaven/web-client-ui/issues/1664)) ([fd8a6c6](https://github.com/deephaven/web-client-ui/commit/fd8a6c65d64b93ba69849b6053d5bbbd9d72c4dc))
- adjust filter bar colour ([#1666](https://github.com/deephaven/web-client-ui/issues/1666)) ([4c0200e](https://github.com/deephaven/web-client-ui/commit/4c0200e71e350fcf5261b0cc28440cb798bec207))
- convert organize columns component to purecomponent ([#1653](https://github.com/deephaven/web-client-ui/issues/1653)) ([8ddc114](https://github.com/deephaven/web-client-ui/commit/8ddc11458b0f52d7a96f673f061d60c63cb7b24a)), closes [#1650](https://github.com/deephaven/web-client-ui/issues/1650)
- Default to `Skip` operation instead of `Sum` operation ([#1648](https://github.com/deephaven/web-client-ui/issues/1648)) ([6083173](https://github.com/deephaven/web-client-ui/commit/608317358fe8eef0de365429265cfbd113340c33)), closes [#1355](https://github.com/deephaven/web-client-ui/issues/1355) [#1355](https://github.com/deephaven/web-client-ui/issues/1355)
- Fix button snapshots ([#1655](https://github.com/deephaven/web-client-ui/issues/1655)) ([c0cc966](https://github.com/deephaven/web-client-ui/commit/c0cc9667b70d8d21668c1d2bcfabe231cc3236bb))
- popper blur in styleguide ([#1672](https://github.com/deephaven/web-client-ui/issues/1672)) ([6fa2204](https://github.com/deephaven/web-client-ui/commit/6fa22046b0a327c8a1a6c5ab851cc064ae400bf8))
- Unable to delete selected rows in some input tables ([#1678](https://github.com/deephaven/web-client-ui/issues/1678)) ([1e71550](https://github.com/deephaven/web-client-ui/commit/1e71550ac024e4b66c601fe2b85684b2463b905b)), closes [#1677](https://github.com/deephaven/web-client-ui/issues/1677)

### Features

- Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
- forward and back button for organize column search ([#1641](https://github.com/deephaven/web-client-ui/issues/1641)) ([89f2be5](https://github.com/deephaven/web-client-ui/commit/89f2be56647c977e4150f050ceec9e33f4c07680)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
- Tables that have names starting with underscore do not auto-launch from console ([#1656](https://github.com/deephaven/web-client-ui/issues/1656)) ([21131fe](https://github.com/deephaven/web-client-ui/commit/21131fe3cb508d8e6fb057d3bae993ca3dd1a23b)), closes [#1549](https://github.com/deephaven/web-client-ui/issues/1549) [#1410](https://github.com/deephaven/web-client-ui/issues/1410)
- theme fontawesome icon size wrapped in spectrum icons ([#1658](https://github.com/deephaven/web-client-ui/issues/1658)) ([2aa8cef](https://github.com/deephaven/web-client-ui/commit/2aa8cef6ce5a419b20c8a74d107bd523156d8ea4))
- Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
- Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
- Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))
- View cell contents in context menu ([#1657](https://github.com/deephaven/web-client-ui/issues/1657)) ([90b7517](https://github.com/deephaven/web-client-ui/commit/90b7517c42024cbefce3481e13a126c619def1fa)), closes [#1605](https://github.com/deephaven/web-client-ui/issues/1605)

### BREAKING CHANGES

- Bootstrap color variables are now predominantly hsl
  based. SCSS will need to be updated accordingly. Theme providers are
  needed to load themes.
- Tables assigned to variable beginning with "\_" will not
  open automatically even if "Auto Launch Panels" is checked.

# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

### Bug Fixes

- Changes for Deephaven UI embedding widget plugins ([#1644](https://github.com/deephaven/web-client-ui/issues/1644)) ([b6eeb30](https://github.com/deephaven/web-client-ui/commit/b6eeb309e8e55522d99c1528958bd0c7674e2d0f))
- Fixed chart e2e test changing daily ([#1652](https://github.com/deephaven/web-client-ui/issues/1652)) ([f9f62db](https://github.com/deephaven/web-client-ui/commit/f9f62db37fbb0fbb97a012b33d27d383ccd1ca40)), closes [#1634](https://github.com/deephaven/web-client-ui/issues/1634)
- Isolate Styleguide snapshots ([#1649](https://github.com/deephaven/web-client-ui/issues/1649)) ([a2ef056](https://github.com/deephaven/web-client-ui/commit/a2ef05681f348f02f46859909875e61c959a66dc))

### Features

- forward and back buttons for organize column search ([#1620](https://github.com/deephaven/web-client-ui/issues/1620)) ([75cf184](https://github.com/deephaven/web-client-ui/commit/75cf184f4b4b9d9a771544ea6335e5d2733368d9)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
- Styleguide regression tests ([#1639](https://github.com/deephaven/web-client-ui/issues/1639)) ([561ff22](https://github.com/deephaven/web-client-ui/commit/561ff22714a8b39cc55b41549712b5ef23bd39cf)), closes [#1634](https://github.com/deephaven/web-client-ui/issues/1634)

### Reverts

- feat: forward and back buttons for organize column search ([#1640](https://github.com/deephaven/web-client-ui/issues/1640)) ([737d1aa](https://github.com/deephaven/web-client-ui/commit/737d1aa98d04800377035d7d189219fefacfa23f))

# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)

### Bug Fixes

- Date argument non-optional for the onChange prop ([#1622](https://github.com/deephaven/web-client-ui/issues/1622)) ([9a960b3](https://github.com/deephaven/web-client-ui/commit/9a960b3a50eed904fce61d3e97307261582a1de7)), closes [#1601](https://github.com/deephaven/web-client-ui/issues/1601)
- Fixing grid colors and grays ([#1621](https://github.com/deephaven/web-client-ui/issues/1621)) ([9ab2b1e](https://github.com/deephaven/web-client-ui/commit/9ab2b1e3204c7f854b8526e510b1e5a5fc59b8f6)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)
- Infinite loop with grid rendering ([#1631](https://github.com/deephaven/web-client-ui/issues/1631)) ([4875d2e](https://github.com/deephaven/web-client-ui/commit/4875d2e1e895478720950ad73f28d1b895114a58)), closes [#1626](https://github.com/deephaven/web-client-ui/issues/1626)
- Log figure errors, don't show infinite spinner ([#1614](https://github.com/deephaven/web-client-ui/issues/1614)) ([75783d0](https://github.com/deephaven/web-client-ui/commit/75783d0ed96e9e28214ca8681a73f23b1dc78085))
- non-contiguous table row selection background colour ([#1623](https://github.com/deephaven/web-client-ui/issues/1623)) ([61d1a53](https://github.com/deephaven/web-client-ui/commit/61d1a537ac9df31e3fe3dad95107b065a12ebd3b)), closes [#1619](https://github.com/deephaven/web-client-ui/issues/1619)
- Panels not reinitializing if makeModel changes ([#1633](https://github.com/deephaven/web-client-ui/issues/1633)) ([5ee98cd](https://github.com/deephaven/web-client-ui/commit/5ee98cd8121a90535536ac6c429bbd0ba2c1a2f3))
- remove unecessary dom re-calc in grid render ([#1632](https://github.com/deephaven/web-client-ui/issues/1632)) ([ce7cc3e](https://github.com/deephaven/web-client-ui/commit/ce7cc3e6104eb208b3b36e51f62d284dfd7f57bc))

### Features

- Add `LayoutManagerContext` and `useLayoutManager` ([#1625](https://github.com/deephaven/web-client-ui/issues/1625)) ([0a6965a](https://github.com/deephaven/web-client-ui/commit/0a6965a41953470cb032ef44d93497fa438783e4))
- Add ResizeObserver to Grid and Chart ([#1626](https://github.com/deephaven/web-client-ui/issues/1626)) ([35311c8](https://github.com/deephaven/web-client-ui/commit/35311c832040b29e362c28f80983b4664c9aa1d5))
- Added test:debug script ([#1628](https://github.com/deephaven/web-client-ui/issues/1628)) ([80f29f5](https://github.com/deephaven/web-client-ui/commit/80f29f57ffae49c5161d4a2431b46fe5af2384af)), closes [#1627](https://github.com/deephaven/web-client-ui/issues/1627)
- Read settings from props/server config when available ([#1558](https://github.com/deephaven/web-client-ui/issues/1558)) ([52ba2cd](https://github.com/deephaven/web-client-ui/commit/52ba2cd125ff68f71c479d2d7c82f4b08d5b2ab6))
- Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)

### BREAKING CHANGES

- - ChartThemeProvider is now required to provide ChartTheme

* ChartModelFactory and ChartUtils now require chartTheme args

# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

### Bug Fixes

- DH-15864: Scroll position StuckToBottom shouldn't trigger sharing dot ([#1617](https://github.com/deephaven/web-client-ui/issues/1617)) ([3d4499b](https://github.com/deephaven/web-client-ui/commit/3d4499b24375090267f6f631e6a72c259dc97651))
- Panel focus throwing an exception ([#1609](https://github.com/deephaven/web-client-ui/issues/1609)) ([9e8b7ae](https://github.com/deephaven/web-client-ui/commit/9e8b7aef65cbae5aa453b33a66dfbdb5a17b1298))
- Plugins were re-registering on every re-render ([#1613](https://github.com/deephaven/web-client-ui/issues/1613)) ([5977389](https://github.com/deephaven/web-client-ui/commit/59773893644431daae23761ea02e6ccc8f44c413))

### Features

- Add support for multi-partition parquet:kv tables ([#1580](https://github.com/deephaven/web-client-ui/issues/1580)) ([d92c91e](https://github.com/deephaven/web-client-ui/commit/d92c91e8b47f412e333a92e4e6649557eea99707)), closes [#1143](https://github.com/deephaven/web-client-ui/issues/1143) [#1438](https://github.com/deephaven/web-client-ui/issues/1438)
- Babel Plugin - Mock css imports ([#1607](https://github.com/deephaven/web-client-ui/issues/1607)) ([787c542](https://github.com/deephaven/web-client-ui/commit/787c5420ecb90661ae5032e174f292707e908820)), closes [#1606](https://github.com/deephaven/web-client-ui/issues/1606)
- Convert DashboardPlugins to WidgetPlugins ([#1598](https://github.com/deephaven/web-client-ui/issues/1598)) ([a260842](https://github.com/deephaven/web-client-ui/commit/a2608428075728a5a5edf770975eed0e11a428ff)), closes [#1573](https://github.com/deephaven/web-client-ui/issues/1573)

### Reverts

- "fix: stuck to bottom on filter clear" ([#1616](https://github.com/deephaven/web-client-ui/issues/1616)) ([806a6b6](https://github.com/deephaven/web-client-ui/commit/806a6b61543cfb13cd7905a9d42edb32aeb3c577)), closes [deephaven/web-client-ui#1579](https://github.com/deephaven/web-client-ui/issues/1579) [#1615](https://github.com/deephaven/web-client-ui/issues/1615)

# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

### Bug Fixes

- stuck to bottom on filter clear ([#1579](https://github.com/deephaven/web-client-ui/issues/1579)) ([ef52749](https://github.com/deephaven/web-client-ui/commit/ef527498970fd0d994d90d9824bc3a55582f5b4c)), closes [#1477](https://github.com/deephaven/web-client-ui/issues/1477) [#1571](https://github.com/deephaven/web-client-ui/issues/1571) [#1571](https://github.com/deephaven/web-client-ui/issues/1571)
- Theming - switched from ?inline to ?raw css imports ([#1600](https://github.com/deephaven/web-client-ui/issues/1600)) ([f6d0874](https://github.com/deephaven/web-client-ui/commit/f6d0874a98cc7377c3857a44930b5c636b72ca1f)), closes [#1599](https://github.com/deephaven/web-client-ui/issues/1599)

### BREAKING CHANGES

- Theme css imports were switched from `?inline` to
  `?raw`. Not likely that we have any consumers yet, but this would impact
  webpack config.

# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)

### Bug Fixes

- Adjusted Monaco "white" colors ([#1594](https://github.com/deephaven/web-client-ui/issues/1594)) ([c736708](https://github.com/deephaven/web-client-ui/commit/c736708e0dd39aa1d0f171f1e9ecf69023647021)), closes [#1592](https://github.com/deephaven/web-client-ui/issues/1592)
- cap width of columns with long names ([#1574](https://github.com/deephaven/web-client-ui/issues/1574)) ([876a6ac](https://github.com/deephaven/web-client-ui/commit/876a6acd00d239f3ac7df21e27db74a16e4fd1b7)), closes [#1276](https://github.com/deephaven/web-client-ui/issues/1276)
- Enabled pointer capabilities for Firefox in Playwright ([#1589](https://github.com/deephaven/web-client-ui/issues/1589)) ([f440a38](https://github.com/deephaven/web-client-ui/commit/f440a383bc5ddc7c8beb06d858d6e0bf4ad1da29)), closes [#1588](https://github.com/deephaven/web-client-ui/issues/1588)
- Remove @deephaven/app-utils from @deephaven/dashboard-core-plugins dependency list ([#1596](https://github.com/deephaven/web-client-ui/issues/1596)) ([7b59763](https://github.com/deephaven/web-client-ui/commit/7b59763d528a95eaca32e4c9607c50d447215798)), closes [#1593](https://github.com/deephaven/web-client-ui/issues/1593)
- Tab in console input triggers autocomplete instead of indent ([#1591](https://github.com/deephaven/web-client-ui/issues/1591)) ([fbe1e70](https://github.com/deephaven/web-client-ui/commit/fbe1e70135008db293878368ad62f742b8166e19))

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

- Change display of rollup key columns from null to empty string ([#1563](https://github.com/deephaven/web-client-ui/issues/1563)) ([327bcb6](https://github.com/deephaven/web-client-ui/commit/327bcb649d47bff648a71fd7f979a63094650b25)), closes [#1483](https://github.com/deephaven/web-client-ui/issues/1483)
- Disabled failing e2e test ([#1554](https://github.com/deephaven/web-client-ui/issues/1554)) ([49723ec](https://github.com/deephaven/web-client-ui/commit/49723ec6669b6afb0c74f2c4e8d88862a64e0f06)), closes [#1553](https://github.com/deephaven/web-client-ui/issues/1553)
- Formatting Rule Doesn't use default set by user ([#1547](https://github.com/deephaven/web-client-ui/issues/1547)) ([ce51229](https://github.com/deephaven/web-client-ui/commit/ce51229231a9aae27871901412177e33dad24bea))
- Handle deletion of unsaved copied file in NotebookPanel ([#1557](https://github.com/deephaven/web-client-ui/issues/1557)) ([4021aac](https://github.com/deephaven/web-client-ui/commit/4021aac3bc130f8eec84385c9aadcb4ecf0b995c)), closes [#1359](https://github.com/deephaven/web-client-ui/issues/1359)
- Prompt for resetting layout ([#1552](https://github.com/deephaven/web-client-ui/issues/1552)) ([a273e64](https://github.com/deephaven/web-client-ui/commit/a273e6433a81f5500fb39992cac276bcbdbda753)), closes [#1250](https://github.com/deephaven/web-client-ui/issues/1250)

- fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)

### Features

- Add copy/rename/delete options to notebook overflow menu ([#1551](https://github.com/deephaven/web-client-ui/issues/1551)) ([4441109](https://github.com/deephaven/web-client-ui/commit/4441109d10dcee8a9415b6884114ee5083fd1cc0)), closes [#1359](https://github.com/deephaven/web-client-ui/issues/1359)
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

### Bug Fixes

- Copy did not work from embedded iframes ([#1528](https://github.com/deephaven/web-client-ui/issues/1528)) ([3549a33](https://github.com/deephaven/web-client-ui/commit/3549a33c6152660ed44601eb2e03312d694e6167)), closes [#1527](https://github.com/deephaven/web-client-ui/issues/1527)
- Dehydration of class components ([#1535](https://github.com/deephaven/web-client-ui/issues/1535)) ([3e834de](https://github.com/deephaven/web-client-ui/commit/3e834de31a5ba8df8041637ece4aacfa7fbcd794)), closes [#1534](https://github.com/deephaven/web-client-ui/issues/1534)
- inconsistent drag for webkit ([#1518](https://github.com/deephaven/web-client-ui/issues/1518)) ([cd5408c](https://github.com/deephaven/web-client-ui/commit/cd5408c7f814cb96c2697b7c67fe27883ecdf779)), closes [#1360](https://github.com/deephaven/web-client-ui/issues/1360)
- Render tables partitioned by non-string columns ([#1533](https://github.com/deephaven/web-client-ui/issues/1533)) ([585b2ff](https://github.com/deephaven/web-client-ui/commit/585b2ffc533dd95ff56247627c7ea1e0928f337b)), closes [#1441](https://github.com/deephaven/web-client-ui/issues/1441)
- Right clicking with a custom context menu open should open another context menu ([#1526](https://github.com/deephaven/web-client-ui/issues/1526)) ([bd08e1f](https://github.com/deephaven/web-client-ui/commit/bd08e1fa50d938a94ead82f55b365b7c00e8d8f0)), closes [#1525](https://github.com/deephaven/web-client-ui/issues/1525)

# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

### Bug Fixes

- Plugin peer dependencies do not get versions from lerna ([#1517](https://github.com/deephaven/web-client-ui/issues/1517)) ([322f6ff](https://github.com/deephaven/web-client-ui/commit/322f6ff7d2ef949774bab61527e5e1c32f344da6))
- Table overflow button has lower priority than grid tokens ([#1510](https://github.com/deephaven/web-client-ui/issues/1510)) ([32e6d20](https://github.com/deephaven/web-client-ui/commit/32e6d208d0977092f315caa122b8ab23f0fc110a)), closes [#1480](https://github.com/deephaven/web-client-ui/issues/1480)

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
- webpack dynamic import ([#1509](https://github.com/deephaven/web-client-ui/issues/1509)) ([1e8bb72](https://github.com/deephaven/web-client-ui/commit/1e8bb727993fdeb7b965f60d72d6353ae3538ac5))

### Features

- Expose containerRef from ChartPanel ([#1500](https://github.com/deephaven/web-client-ui/issues/1500)) ([848fef4](https://github.com/deephaven/web-client-ui/commit/848fef4fe653193a2b49c4a45ccffe29349a821d))

# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)

### Bug Fixes

- Change dynamic import to string ([#1484](https://github.com/deephaven/web-client-ui/issues/1484)) ([45e2ada](https://github.com/deephaven/web-client-ui/commit/45e2adae7df804b8982ca3cd9df89db3422ac9cf))
- Console History Not Scrolling to Bottom (DH-14062) ([#1481](https://github.com/deephaven/web-client-ui/issues/1481)) ([93687a7](https://github.com/deephaven/web-client-ui/commit/93687a78fa2d0e2da567efd8da2c671252ba8fe5))
- Forbid [@deephaven](https://github.com/deephaven) modules from self importing ([#1499](https://github.com/deephaven/web-client-ui/issues/1499)) ([81cdd65](https://github.com/deephaven/web-client-ui/commit/81cdd6512456bcc08fde776670659a6028841875)), closes [#1497](https://github.com/deephaven/web-client-ui/issues/1497)
- quick filter focus text doesn't match canvas text ([#1475](https://github.com/deephaven/web-client-ui/issues/1475)) ([02841b5](https://github.com/deephaven/web-client-ui/commit/02841b5a9dedc25160f319a072636335aa77599f)), closes [#1472](https://github.com/deephaven/web-client-ui/issues/1472)
- Remove totals table rows from displayed row count ([#1492](https://github.com/deephaven/web-client-ui/issues/1492)) ([f686891](https://github.com/deephaven/web-client-ui/commit/f68689121c7df098dbf86fa76bf2ccf8dbda6566)), closes [#1407](https://github.com/deephaven/web-client-ui/issues/1407)

### Features

- adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)
- bindAllMethods util function ([#1476](https://github.com/deephaven/web-client-ui/issues/1476)) ([0dab8d7](https://github.com/deephaven/web-client-ui/commit/0dab8d70f299441271fe7047f9d4f2eb48a6d8be)), closes [#1474](https://github.com/deephaven/web-client-ui/issues/1474)
- Consolidate and normalize plugin types ([#1456](https://github.com/deephaven/web-client-ui/issues/1456)) ([43a782d](https://github.com/deephaven/web-client-ui/commit/43a782dd3ebf582b18e155fdbc313176b0bf0f84)), closes [#1454](https://github.com/deephaven/web-client-ui/issues/1454) [#1451](https://github.com/deephaven/web-client-ui/issues/1451)

## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)

### Bug Fixes

- flaky e2e tests ([#1453](https://github.com/deephaven/web-client-ui/issues/1453)) ([d59e9be](https://github.com/deephaven/web-client-ui/commit/d59e9bed95152170626265a00ea27d716e1b2bcb))
- Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)
- Heap usage should tick immediately when dependencies change ([#1468](https://github.com/deephaven/web-client-ui/issues/1468)) ([96b27a5](https://github.com/deephaven/web-client-ui/commit/96b27a50695eafaaf55d3a103c4c349225806afa)), closes [#1464](https://github.com/deephaven/web-client-ui/issues/1464)
- legal notices dismisses on click anywhere ([#1452](https://github.com/deephaven/web-client-ui/issues/1452)) ([a189375](https://github.com/deephaven/web-client-ui/commit/a18937562f6e9ce2d62b27f79a60adc341a435e9))
- Remove unused ref forwarded to all dashboard panels ([#1451](https://github.com/deephaven/web-client-ui/issues/1451)) ([938aa07](https://github.com/deephaven/web-client-ui/commit/938aa0724abb58b09d8ce1d339766b1072c95202))
- Zip CSV uploads not working ([#1457](https://github.com/deephaven/web-client-ui/issues/1457)) ([08d0296](https://github.com/deephaven/web-client-ui/commit/08d0296fee6a695c8312dec7d3bed648f10c7acb)), closes [#1080](https://github.com/deephaven/web-client-ui/issues/1080) [#1416](https://github.com/deephaven/web-client-ui/issues/1416)

# [0.46.0](https://github.com/deephaven/web-client-ui/compare/v0.45.1...v0.46.0) (2023-08-18)

### Bug Fixes

- Environment variable replacement in styleguide ([#1443](https://github.com/deephaven/web-client-ui/issues/1443)) ([9fd5c27](https://github.com/deephaven/web-client-ui/commit/9fd5c27df9af4c6e63117e07f90c2fdc3029dfe1))
- failing table operations e2e test ([#1447](https://github.com/deephaven/web-client-ui/issues/1447)) ([6d2cb06](https://github.com/deephaven/web-client-ui/commit/6d2cb062665b0ba60b3397ed74f9b703d598f154))
- login page looks bad when narrow ([#1428](https://github.com/deephaven/web-client-ui/issues/1428)) ([6e0b60e](https://github.com/deephaven/web-client-ui/commit/6e0b60e2087465eb99230411334fc2ee355c0778)), closes [#1399](https://github.com/deephaven/web-client-ui/issues/1399)
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

### Bug Fixes

- Cannot import CSV with LOCAL_TIME ([#1434](https://github.com/deephaven/web-client-ui/issues/1434)) ([caa6bc8](https://github.com/deephaven/web-client-ui/commit/caa6bc8a801176b4624127aeb3c1e1cf1e346df3)), closes [#1432](https://github.com/deephaven/web-client-ui/issues/1432)

### Features

- Added .git-blame-ignore-revs ([#1431](https://github.com/deephaven/web-client-ui/issues/1431)) ([e3db6bf](https://github.com/deephaven/web-client-ui/commit/e3db6bfba375b081892d25183d45c3724435ba62)), closes [#1429](https://github.com/deephaven/web-client-ui/issues/1429)

# [0.45.0](https://github.com/deephaven/web-client-ui/compare/v0.44.1...v0.45.0) (2023-07-31)

### Bug Fixes

- Ran npm audit fix on packages ([#1421](https://github.com/deephaven/web-client-ui/issues/1421)) ([0d61220](https://github.com/deephaven/web-client-ui/commit/0d61220bb0b25e7e0a406df96a25f87b644f2716))

### Features

- Add support for Category plots with error bars ([#1412](https://github.com/deephaven/web-client-ui/issues/1412)) ([7480280](https://github.com/deephaven/web-client-ui/commit/7480280861d588ba7c1d011a748d65df587fcfa8))
- Added containsIgnoreCase to FilterValue interface ([#1426](https://github.com/deephaven/web-client-ui/issues/1426)) ([d131b05](https://github.com/deephaven/web-client-ui/commit/d131b051c6dece462a6691ca0013bb4fb0ba9a71)), closes [#1425](https://github.com/deephaven/web-client-ui/issues/1425)
- Upgrade Prettier to 3.0.0 ([#1420](https://github.com/deephaven/web-client-ui/issues/1420)) ([334e530](https://github.com/deephaven/web-client-ui/commit/334e530bf83cebf2cfe3593f2d6e9fd7304c562a)), closes [#1419](https://github.com/deephaven/web-client-ui/issues/1419)

## [0.44.1](https://github.com/deephaven/web-client-ui/compare/v0.44.0...v0.44.1) (2023-07-11)

### Bug Fixes

- tree and rollup default to non-sortable ([#1404](https://github.com/deephaven/web-client-ui/issues/1404)) ([5a8f34d](https://github.com/deephaven/web-client-ui/commit/5a8f34def53f03796fab265e2d1b1951480b5ecb)), closes [#1402](https://github.com/deephaven/web-client-ui/issues/1402)

# [0.44.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.44.0) (2023-07-07)

### Bug Fixes

- export TypeUtils ([#1395](https://github.com/deephaven/web-client-ui/issues/1395)) ([c76730f](https://github.com/deephaven/web-client-ui/commit/c76730f5a6f8a973b3e51bb7c7da5e79891ac86c))
- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

### Features

- "Extends" TypeScript util type ([#1394](https://github.com/deephaven/web-client-ui/issues/1394)) ([7cb073f](https://github.com/deephaven/web-client-ui/commit/7cb073f8897a0a03e2f86c65f94faccc46fded35)), closes [#1393](https://github.com/deephaven/web-client-ui/issues/1393)
- DH-14538: Export InputEditor and added options ([#1398](https://github.com/deephaven/web-client-ui/issues/1398)) ([405f42f](https://github.com/deephaven/web-client-ui/commit/405f42f9dfc880319c7d5afbf80d81b04965ec52)), closes [#1397](https://github.com/deephaven/web-client-ui/issues/1397)
- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)
- Outdent code when running selection from a notebook ([#1391](https://github.com/deephaven/web-client-ui/issues/1391)) ([154ccfc](https://github.com/deephaven/web-client-ui/commit/154ccfccd5a6f9996d67f0fcc71d031985bfd6a5)), closes [#1326](https://github.com/deephaven/web-client-ui/issues/1326)

# [0.43.0](https://github.com/deephaven/web-client-ui/compare/v0.42.0...v0.43.0) (2023-07-07)

### Bug Fixes

- export TypeUtils ([#1395](https://github.com/deephaven/web-client-ui/issues/1395)) ([c76730f](https://github.com/deephaven/web-client-ui/commit/c76730f5a6f8a973b3e51bb7c7da5e79891ac86c))
- Use user permissions for iframes instead of query parameters ([#1400](https://github.com/deephaven/web-client-ui/issues/1400)) ([8cf2bbd](https://github.com/deephaven/web-client-ui/commit/8cf2bbd754f9312ca19945e9ffa6d7ce542c9516)), closes [#1337](https://github.com/deephaven/web-client-ui/issues/1337)

### Features

- "Extends" TypeScript util type ([#1394](https://github.com/deephaven/web-client-ui/issues/1394)) ([7cb073f](https://github.com/deephaven/web-client-ui/commit/7cb073f8897a0a03e2f86c65f94faccc46fded35)), closes [#1393](https://github.com/deephaven/web-client-ui/issues/1393)
- DH-14538: Export InputEditor and added options ([#1398](https://github.com/deephaven/web-client-ui/issues/1398)) ([405f42f](https://github.com/deephaven/web-client-ui/commit/405f42f9dfc880319c7d5afbf80d81b04965ec52)), closes [#1397](https://github.com/deephaven/web-client-ui/issues/1397)
- disable column sorting on unsupported types ([#1390](https://github.com/deephaven/web-client-ui/issues/1390)) ([3a89bbf](https://github.com/deephaven/web-client-ui/commit/3a89bbf4d28494c03541d474deb408c2ece4606a)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)
- Outdent code when running selection from a notebook ([#1391](https://github.com/deephaven/web-client-ui/issues/1391)) ([154ccfc](https://github.com/deephaven/web-client-ui/commit/154ccfccd5a6f9996d67f0fcc71d031985bfd6a5)), closes [#1326](https://github.com/deephaven/web-client-ui/issues/1326)

# [0.42.0](https://github.com/deephaven/web-client-ui/compare/v0.41.1...v0.42.0) (2023-06-29)

### Bug Fixes

- AuthPluginParent wasn't working when embedded in an iframe ([#1383](https://github.com/deephaven/web-client-ui/issues/1383)) ([e23695d](https://github.com/deephaven/web-client-ui/commit/e23695d4baf232720ca89cb7d24e9a918f3fe913)), closes [#1373](https://github.com/deephaven/web-client-ui/issues/1373)
- DH-15032: Fix incorrect warning about updated shared state ([#1364](https://github.com/deephaven/web-client-ui/issues/1364)) ([9e53dd2](https://github.com/deephaven/web-client-ui/commit/9e53dd2796b84963bd90e7043122a6b2c4d3cf46))
- Ran npm audit fix on packages ([#1357](https://github.com/deephaven/web-client-ui/issues/1357)) ([0830099](https://github.com/deephaven/web-client-ui/commit/083009992e5f727f6f9dc9e9c2280b614315ab99))

### Features

- add column count to table tooltip ([#1382](https://github.com/deephaven/web-client-ui/issues/1382)) ([004ac6c](https://github.com/deephaven/web-client-ui/commit/004ac6cc1bd7772477b8e922075a344a4f8e71d3))
- add sort-slash icon ([#1381](https://github.com/deephaven/web-client-ui/issues/1381)) ([9a7b910](https://github.com/deephaven/web-client-ui/commit/9a7b910f2075b252c81c08c7cc54f61bbe4458db)), closes [#1380](https://github.com/deephaven/web-client-ui/issues/1380)
- Console output test util ([#1370](https://github.com/deephaven/web-client-ui/issues/1370)) ([626de83](https://github.com/deephaven/web-client-ui/commit/626de830ba4f580c90b0d0e2ee51ce8fd0452ad9)), closes [#1369](https://github.com/deephaven/web-client-ui/issues/1369)
- improvements to null and empty strings filters in grid ([#1348](https://github.com/deephaven/web-client-ui/issues/1348)) ([ed3a8c5](https://github.com/deephaven/web-client-ui/commit/ed3a8c5f224094306ff55f9b41706cb58ff709e2)), closes [#1243](https://github.com/deephaven/web-client-ui/issues/1243)

### Reverts

- adding back "Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212))" ([#1365](https://github.com/deephaven/web-client-ui/issues/1365)) ([8586d4d](https://github.com/deephaven/web-client-ui/commit/8586d4d99e55def1747eb820e824b61703990e58))

## [0.41.1](https://github.com/deephaven/web-client-ui/compare/v0.41.0...v0.41.1) (2023-06-08)

### Bug Fixes

- Cannot add control from Controls menu with click ([#1363](https://github.com/deephaven/web-client-ui/issues/1363)) ([65c0925](https://github.com/deephaven/web-client-ui/commit/65c09253608f7c8c887ca4e70cc5632e81673301)), closes [#1362](https://github.com/deephaven/web-client-ui/issues/1362)

# [0.41.0](https://github.com/deephaven/web-client-ui/compare/v0.40.4...v0.41.0) (2023-06-08)

### Bug Fixes

- Catch errors when emitting events to prevent breaking entire layout ([#1353](https://github.com/deephaven/web-client-ui/issues/1353)) ([aac5bd2](https://github.com/deephaven/web-client-ui/commit/aac5bd2ad4aeb88ac1fb18236f7bfb983ae35cf0)), closes [#1352](https://github.com/deephaven/web-client-ui/issues/1352)
- DH-14972 Remove setSearch debounce in CommandHistoryViewportUpdater ([#1351](https://github.com/deephaven/web-client-ui/issues/1351)) ([2601146](https://github.com/deephaven/web-client-ui/commit/26011467be3bb5947a2cf34d78eaaaedc47d909b))

### Features

- Improve golden layout tab overflow drop down behaviour ([#1330](https://github.com/deephaven/web-client-ui/issues/1330)) ([9331822](https://github.com/deephaven/web-client-ui/commit/933182277eb4226caa45871d651789a70fc573d3))

## [0.40.4](https://github.com/deephaven/web-client-ui/compare/v0.40.3...v0.40.4) (2023-06-02)

### Bug Fixes

- Add a default DashboardPanelWrapper ([#1346](https://github.com/deephaven/web-client-ui/issues/1346)) ([ddd92cf](https://github.com/deephaven/web-client-ui/commit/ddd92cf94ee038da9f6b998b12f533d17a400bc4)), closes [#1329](https://github.com/deephaven/web-client-ui/issues/1329)
- DateWrapper fails on first day of month ([#1342](https://github.com/deephaven/web-client-ui/issues/1342)) ([a4677eb](https://github.com/deephaven/web-client-ui/commit/a4677eb0215b9f3746d68068b0ae13b36736a228)), closes [#1341](https://github.com/deephaven/web-client-ui/issues/1341)
- DH-14657 Disconnect handling increase debounce timeout ([#1347](https://github.com/deephaven/web-client-ui/issues/1347)) ([66bdad8](https://github.com/deephaven/web-client-ui/commit/66bdad8b548e62c938cc13bc9fe0dd7ca1257943))
- panels menu should only open downwards ([#1340](https://github.com/deephaven/web-client-ui/issues/1340)) ([a25be7f](https://github.com/deephaven/web-client-ui/commit/a25be7f0c0e043340bed88ad5a5923ab852917ee))

## [0.40.3](https://github.com/deephaven/web-client-ui/compare/v0.40.2...v0.40.3) (2023-05-31)

### Bug Fixes

- today/yesterday keywords failed on last/first day of month ([#1336](https://github.com/deephaven/web-client-ui/issues/1336)) ([4c3fe24](https://github.com/deephaven/web-client-ui/commit/4c3fe24c083a827b0d8ec57219a0083c84bb894c)), closes [#1335](https://github.com/deephaven/web-client-ui/issues/1335)

### Reverts

- "refactor: Clean up golden-layout css ([#1322](https://github.com/deephaven/web-client-ui/issues/1322))" ([#1334](https://github.com/deephaven/web-client-ui/issues/1334)) ([2f7928a](https://github.com/deephaven/web-client-ui/commit/2f7928a67e14f2026aef73cee542045ce7477351))

## [0.40.2](https://github.com/deephaven/web-client-ui/compare/v0.40.1...v0.40.2) (2023-05-31)

### Bug Fixes

- disable screenshot tests in debug mode ([#1328](https://github.com/deephaven/web-client-ui/issues/1328)) ([cbe8f72](https://github.com/deephaven/web-client-ui/commit/cbe8f72267a270c41dcb7fd241e6da424fade296)), closes [#1327](https://github.com/deephaven/web-client-ui/issues/1327)
- failing linter test from de-globalize PR ([#1321](https://github.com/deephaven/web-client-ui/issues/1321)) ([6ae174c](https://github.com/deephaven/web-client-ui/commit/6ae174c9b6ae222abc515f09d609747976d9d6d6))
- notebook panel unsaved indicator not showing after dragging a panel ([#1325](https://github.com/deephaven/web-client-ui/issues/1325)) ([99818a8](https://github.com/deephaven/web-client-ui/commit/99818a8ee4b505da7708914105a4197abdc502d8))
- truncated column headers ([#1319](https://github.com/deephaven/web-client-ui/issues/1319)) ([db7716e](https://github.com/deephaven/web-client-ui/commit/db7716ebe953611ab4b4eec781e2e03204380ebd)), closes [#1318](https://github.com/deephaven/web-client-ui/issues/1318)
- Worker plugin definitions, optional panel wrapper for Dashboards ([#1329](https://github.com/deephaven/web-client-ui/issues/1329)) ([c32ffbc](https://github.com/deephaven/web-client-ui/commit/c32ffbcf66826c4e2da3ac82e5b5086524d05ec8))

## [0.40.1](https://github.com/deephaven/web-client-ui/compare/v0.40.0...v0.40.1) (2023-05-24)

### Bug Fixes

- makeApiContextWrapper and createMockProxy ([#1312](https://github.com/deephaven/web-client-ui/issues/1312)) ([d389963](https://github.com/deephaven/web-client-ui/commit/d3899631c329e4a34f397158c4aae5da4f2f3084)), closes [#1311](https://github.com/deephaven/web-client-ui/issues/1311)

# [0.40.0](https://github.com/deephaven/web-client-ui/compare/v0.39.0...v0.40.0) (2023-05-19)

### Bug Fixes

- drag to re-arrange custom columns not working ([#1299](https://github.com/deephaven/web-client-ui/issues/1299)) ([5e23e4a](https://github.com/deephaven/web-client-ui/commit/5e23e4a9f69eaf6fcb55e0e30ceb490ad913966e)), closes [#1282](https://github.com/deephaven/web-client-ui/issues/1282) [#1013](https://github.com/deephaven/web-client-ui/issues/1013)
- Export useTableUtils ([#1309](https://github.com/deephaven/web-client-ui/issues/1309)) ([9212107](https://github.com/deephaven/web-client-ui/commit/9212107142ae3863201bbb107e701e768c11f44f)), closes [#1308](https://github.com/deephaven/web-client-ui/issues/1308)
- Search icon styleguide using prefixed string ([#1300](https://github.com/deephaven/web-client-ui/issues/1300)) ([0d02ab9](https://github.com/deephaven/web-client-ui/commit/0d02ab9b3d1284edfbce08e7650a1aea875012f3))

### Features

- add contains ignore case in go to row ([#1291](https://github.com/deephaven/web-client-ui/issues/1291)) ([d67712e](https://github.com/deephaven/web-client-ui/commit/d67712e4d031723ea76b429c79465b122ca4efc4)), closes [#1274](https://github.com/deephaven/web-client-ui/issues/1274)
- Mount layout panels inside the main react tree ([#1229](https://github.com/deephaven/web-client-ui/issues/1229)) ([f8f8d61](https://github.com/deephaven/web-client-ui/commit/f8f8d61829cfc409b369fa5af85db60d6107eedf))

# [0.39.0](https://github.com/deephaven/web-client-ui/compare/v0.38.0...v0.39.0) (2023-05-15)

### Bug Fixes

- add word-break to long column names in column tooltip ([#1290](https://github.com/deephaven/web-client-ui/issues/1290)) ([02215b6](https://github.com/deephaven/web-client-ui/commit/02215b6323c58678ae37578ea9d0e0dda68ff880)), closes [#1283](https://github.com/deephaven/web-client-ui/issues/1283)
- DH-14630: useDebouncedViewportSearch: memoization bug ([#1273](https://github.com/deephaven/web-client-ui/issues/1273)) ([be82b14](https://github.com/deephaven/web-client-ui/commit/be82b145501bd1af48e44f068cc157c088711823)), closes [#1272](https://github.com/deephaven/web-client-ui/issues/1272)
- Select distinct throwing for tables with multiple columns ([#1286](https://github.com/deephaven/web-client-ui/issues/1286)) ([4b40e4b](https://github.com/deephaven/web-client-ui/commit/4b40e4b831c3dae4f7b869b71c7f6185560f929e)), closes [#1275](https://github.com/deephaven/web-client-ui/issues/1275)

### Features

- Table rendering support for databars ([#1212](https://github.com/deephaven/web-client-ui/issues/1212)) ([a17cc0e](https://github.com/deephaven/web-client-ui/commit/a17cc0eb2b4e8ba9240c891a15b9d4b7659fb721)), closes [#1151](https://github.com/deephaven/web-client-ui/issues/1151)
- add uncaught rejections to support logs ([#1293](https://github.com/deephaven/web-client-ui/issues/1293)) ([29ed459](https://github.com/deephaven/web-client-ui/commit/29ed459c130dae9d6a1f3876716d25fb2f0a5fea)), closes [#1253](https://github.com/deephaven/web-client-ui/issues/1253)
- Added new icons and added composition example to styleguide ([#1294](https://github.com/deephaven/web-client-ui/issues/1294)) ([97c7ead](https://github.com/deephaven/web-client-ui/commit/97c7ead4174e802b977962a9ff57dded5f4dd114))
- De-globalize JSAPI in Chart package ([#1258](https://github.com/deephaven/web-client-ui/issues/1258)) ([87fa2ef](https://github.com/deephaven/web-client-ui/commit/87fa2ef76e0482a1d641d8fea2d33fdad2996ef5))
- De-globalize JSAPI in Console package ([#1292](https://github.com/deephaven/web-client-ui/issues/1292)) ([3f12dd3](https://github.com/deephaven/web-client-ui/commit/3f12dd38a4db172697b3a7b39e6fbbd83d9f8519))
- De-globalize JSAPI in IrisGrid package ([#1262](https://github.com/deephaven/web-client-ui/issues/1262)) ([588cb8f](https://github.com/deephaven/web-client-ui/commit/588cb8fd080ac992da40e9b732d82e206032c9eb))
- De-globalize utils, formatters, linker ([#1278](https://github.com/deephaven/web-client-ui/issues/1278)) ([cb0e9ba](https://github.com/deephaven/web-client-ui/commit/cb0e9ba432a096cdb61c76787cff66c09a337372))
- DH-14630 - ACL Editor Hooks ([#1257](https://github.com/deephaven/web-client-ui/issues/1257)) ([e0a2a36](https://github.com/deephaven/web-client-ui/commit/e0a2a369ea3c90e9c2e25b7e29823825db14d3f5)), closes [#1260](https://github.com/deephaven/web-client-ui/issues/1260)
- remove click handler setting onTabContentFocusIn ([#1263](https://github.com/deephaven/web-client-ui/issues/1263)) ([7d56f97](https://github.com/deephaven/web-client-ui/commit/7d56f97aceae6329a188b13f89a7df2e7add7395))
- Update @vscode/codicons to v0.0.33 ([#1259](https://github.com/deephaven/web-client-ui/issues/1259)) ([1b29af1](https://github.com/deephaven/web-client-ui/commit/1b29af18fa60411a0e16ca1df27a969b11492c56))
- useTableUtils hook ([#1281](https://github.com/deephaven/web-client-ui/issues/1281)) ([ce1fe2c](https://github.com/deephaven/web-client-ui/commit/ce1fe2ce8cf28c4bc90356ebb25422835b5070df)), closes [#1280](https://github.com/deephaven/web-client-ui/issues/1280)

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

- `generateEmptyKeyedItemsRange` previously required a
  single `count` arg, but now requires a `start` and `end` index
- `vsCircleLargeOutline` icon renamed to `vsCircleLarge`

# [0.38.0](https://github.com/deephaven/web-client-ui/compare/v0.37.3...v0.38.0) (2023-05-03)

### Bug Fixes

- DH-14657 Better disconnect handling ([#1261](https://github.com/deephaven/web-client-ui/issues/1261)) ([9358e41](https://github.com/deephaven/web-client-ui/commit/9358e41fd3d7c587a45788819eec0962a8361202)), closes [#1149](https://github.com/deephaven/web-client-ui/issues/1149)
- Restrict link parsing so it requires protocol ([#1254](https://github.com/deephaven/web-client-ui/issues/1254)) ([0e286bd](https://github.com/deephaven/web-client-ui/commit/0e286bd28d6808297634ce389e820675f6cc5a49)), closes [#1252](https://github.com/deephaven/web-client-ui/issues/1252)

### Features

- Logging out ([#1244](https://github.com/deephaven/web-client-ui/issues/1244)) ([769d753](https://github.com/deephaven/web-client-ui/commit/769d7533cc2e840c83e2189d7ae20dce61eff3be))
- Relative links ([#1204](https://github.com/deephaven/web-client-ui/issues/1204)) ([f440eb9](https://github.com/deephaven/web-client-ui/commit/f440eb9a19c437d2118ec2e6421e1ba4ebc4f56c)), closes [#1070](https://github.com/deephaven/web-client-ui/issues/1070) [#1070](https://github.com/deephaven/web-client-ui/issues/1070)

## [0.37.3](https://github.com/deephaven/web-client-ui/compare/v0.37.2...v0.37.3) (2023-04-25)

### Bug Fixes

- Move @deephaven/redux to be a dependency instead ([#1249](https://github.com/deephaven/web-client-ui/issues/1249)) ([3f24e11](https://github.com/deephaven/web-client-ui/commit/3f24e110ca08c5afa7e39d58d0171f2ce4999404))

## [0.37.2](https://github.com/deephaven/web-client-ui/compare/v0.37.1...v0.37.2) (2023-04-25)

### Bug Fixes

- Fixed bad dependency in package-lock ([#1248](https://github.com/deephaven/web-client-ui/issues/1248)) ([8c78177](https://github.com/deephaven/web-client-ui/commit/8c781778a57ea0940d2a114fdfab0b6f82ce2a80)), closes [#1246](https://github.com/deephaven/web-client-ui/issues/1246)

## [0.37.1](https://github.com/deephaven/web-client-ui/compare/v0.37.0...v0.37.1) (2023-04-25)

### Bug Fixes

- Fixed dependency mapping ([#1247](https://github.com/deephaven/web-client-ui/issues/1247)) ([1e250a9](https://github.com/deephaven/web-client-ui/commit/1e250a9d096e03c77915495f277dabd717695319)), closes [#1246](https://github.com/deephaven/web-client-ui/issues/1246)

# [0.37.0](https://github.com/deephaven/web-client-ui/compare/v0.36.0...v0.37.0) (2023-04-20)

### Bug Fixes

- Fix OneClick links not filtering plots ([#1217](https://github.com/deephaven/web-client-ui/issues/1217)) ([9b20f9e](https://github.com/deephaven/web-client-ui/commit/9b20f9e8f3912959e32ae8d8d597ee584357ad70)), closes [#1198](https://github.com/deephaven/web-client-ui/issues/1198)

### Features

- **@deephaven/components:** Custom React Spectrum Provider ([#1211](https://github.com/deephaven/web-client-ui/issues/1211)) ([609c57e](https://github.com/deephaven/web-client-ui/commit/609c57ed38a4a905e52e1d3e2588d3e7079a1b81)), closes [#1210](https://github.com/deephaven/web-client-ui/issues/1210)
- Added support for null in useTableListener ([#1227](https://github.com/deephaven/web-client-ui/issues/1227)) ([e485c86](https://github.com/deephaven/web-client-ui/commit/e485c868b6e82a0ff44a1e2682812a368d05eb7e)), closes [#1228](https://github.com/deephaven/web-client-ui/issues/1228)
- Core authentication plugins ([#1180](https://github.com/deephaven/web-client-ui/issues/1180)) ([1624309](https://github.com/deephaven/web-client-ui/commit/16243090aae7e2731a0c43d09fa8b43e5dfff8fc)), closes [#1058](https://github.com/deephaven/web-client-ui/issues/1058)
- DH-14630 useViewportData + supporting utils ([#1230](https://github.com/deephaven/web-client-ui/issues/1230)) ([2f9c020](https://github.com/deephaven/web-client-ui/commit/2f9c020bfcb1ae508e219759e216a5ef7a63162d)), closes [#1221](https://github.com/deephaven/web-client-ui/issues/1221)
- Improve plugin load error handling ([#1214](https://github.com/deephaven/web-client-ui/issues/1214)) ([8ac7dc8](https://github.com/deephaven/web-client-ui/commit/8ac7dc826af579e129431b222524cb657b326099))
- usePromiseFactory hook ([#1226](https://github.com/deephaven/web-client-ui/issues/1226)) ([f8c4ba3](https://github.com/deephaven/web-client-ui/commit/f8c4ba311b20958ab1b83c086fc94d9f61bf9ddd)), closes [#1221](https://github.com/deephaven/web-client-ui/issues/1221)

# [0.36.0](https://github.com/deephaven/web-client-ui/compare/v0.35.0...v0.36.0) (2023-04-14)

### Bug Fixes

- Freezing a tree table column crashes the panel ([#1192](https://github.com/deephaven/web-client-ui/issues/1192)) ([5142a4d](https://github.com/deephaven/web-client-ui/commit/5142a4d7fc216034d2bd4218b928bfe0768c6dff)), closes [#1136](https://github.com/deephaven/web-client-ui/issues/1136)

### Features

- Display workerName and processInfoId in the console status bar ([#1173](https://github.com/deephaven/web-client-ui/issues/1173)) ([85ce600](https://github.com/deephaven/web-client-ui/commit/85ce600ad63cd49504f75db5663ed64ec095749e))
- Pass optional envoyPrefix query param to CoreClient constructor ([#1219](https://github.com/deephaven/web-client-ui/issues/1219)) ([8b1e58c](https://github.com/deephaven/web-client-ui/commit/8b1e58cf1cb4a1aab18405b87160b223f04ccd9d))
- usePanelRegistration hook ([#1208](https://github.com/deephaven/web-client-ui/issues/1208)) ([d8db9ca](https://github.com/deephaven/web-client-ui/commit/d8db9ca6afc3833020e397d05a791bb96e24c14d)), closes [#1207](https://github.com/deephaven/web-client-ui/issues/1207)

# [0.35.0](https://github.com/deephaven/web-client-ui/compare/v0.34.0...v0.35.0) (2023-04-04)

### Bug Fixes

- Fix column data appearing incorrectly when multiplier null ([#1194](https://github.com/deephaven/web-client-ui/issues/1194)) ([e22e68d](https://github.com/deephaven/web-client-ui/commit/e22e68d46c98df0eca6ebd38d1487d8784377575)), closes [#1193](https://github.com/deephaven/web-client-ui/issues/1193) [#0](https://github.com/deephaven/web-client-ui/issues/0)
- Fixed generic selector types ([#1199](https://github.com/deephaven/web-client-ui/issues/1199)) ([de9b751](https://github.com/deephaven/web-client-ui/commit/de9b751ee0ba3255b68c1daf50dad417ef7eded4)), closes [#1197](https://github.com/deephaven/web-client-ui/issues/1197)

### Features

- Added isACLEditor prop to Redux state ([#1201](https://github.com/deephaven/web-client-ui/issues/1201)) ([f39100a](https://github.com/deephaven/web-client-ui/commit/f39100a94ec195552a8f6cebf1f484c215f6c79a)), closes [#1200](https://github.com/deephaven/web-client-ui/issues/1200)
- Created ValueOf<T> util type ([#1203](https://github.com/deephaven/web-client-ui/issues/1203)) ([19fcf0e](https://github.com/deephaven/web-client-ui/commit/19fcf0e7efa9290bf4aa072b3dd8a2826f16cc75)), closes [#1202](https://github.com/deephaven/web-client-ui/issues/1202)

# [0.34.0](https://github.com/deephaven/web-client-ui/compare/v0.33.0...v0.34.0) (2023-03-31)

### Bug Fixes

- Conditional formatting not being applied to custom columns ([#1181](https://github.com/deephaven/web-client-ui/issues/1181)) ([1e4f8f9](https://github.com/deephaven/web-client-ui/commit/1e4f8f92e246b417bb2c083a16978ca42ae63e61)), closes [#1135](https://github.com/deephaven/web-client-ui/issues/1135)
- Context menu does not appear when right-clicking IrisGrid component in styleguide ([#1184](https://github.com/deephaven/web-client-ui/issues/1184)) ([696cc2d](https://github.com/deephaven/web-client-ui/commit/696cc2d556081ccc0a70c6fc479d661a59c80c4a)), closes [#1065](https://github.com/deephaven/web-client-ui/issues/1065)
- Double clicking a file causes the loader to flash incorrectly ([#1189](https://github.com/deephaven/web-client-ui/issues/1189)) ([a279670](https://github.com/deephaven/web-client-ui/commit/a279670e536e382e1df17dcb5337f1164c82a3ff)), closes [#942](https://github.com/deephaven/web-client-ui/issues/942)
- Preview did not draw correctly when dragging Grids ([#1183](https://github.com/deephaven/web-client-ui/issues/1183)) ([1a0ff8d](https://github.com/deephaven/web-client-ui/commit/1a0ff8da23c69859ac54531d681fa2356267bab8)), closes [#1112](https://github.com/deephaven/web-client-ui/issues/1112)
- Save or discard a changed notebook does not close modal on first click ([#1188](https://github.com/deephaven/web-client-ui/issues/1188)) ([bba2d01](https://github.com/deephaven/web-client-ui/commit/bba2d01df0c541ca8cfe89753098ff42919036ab)), closes [#1187](https://github.com/deephaven/web-client-ui/issues/1187)
- Typing for WritableStream ([#1186](https://github.com/deephaven/web-client-ui/issues/1186)) ([dfdf356](https://github.com/deephaven/web-client-ui/commit/dfdf356e59a387811794884f13abbd95a163d247)), closes [#803](https://github.com/deephaven/web-client-ui/issues/803)

### Features

- Add signatureHelp and hover providers to monaco ([#1178](https://github.com/deephaven/web-client-ui/issues/1178)) ([f1f3abf](https://github.com/deephaven/web-client-ui/commit/f1f3abffc9df4178477714f06dcc57d40d6942a9))
- Double click notebook tab to remove its preview status ([#1190](https://github.com/deephaven/web-client-ui/issues/1190)) ([4870171](https://github.com/deephaven/web-client-ui/commit/4870171defd2f361295105489c87a41b2c8d1f3a)), closes [#1189](https://github.com/deephaven/web-client-ui/issues/1189)
- JS API reconnect ([#1149](https://github.com/deephaven/web-client-ui/issues/1149)) ([15551df](https://github.com/deephaven/web-client-ui/commit/15551df634b2e67e0697d7e16328d9573b9d4af5)), closes [#1140](https://github.com/deephaven/web-client-ui/issues/1140)

# [0.33.0](https://github.com/deephaven/web-client-ui/compare/v0.32.0...v0.33.0) (2023-03-28)

### Bug Fixes

- Added smarter caching for command history fetching ([#1145](https://github.com/deephaven/web-client-ui/issues/1145)) ([76b3bd5](https://github.com/deephaven/web-client-ui/commit/76b3bd51059638d5b864fabe8b4121b6a3554f17)), closes [#325](https://github.com/deephaven/web-client-ui/issues/325)
- DH-14439 Fix QueryMonitor breaking on "null" in default search filter ([#1159](https://github.com/deephaven/web-client-ui/issues/1159)) ([ac6a514](https://github.com/deephaven/web-client-ui/commit/ac6a51440d7499b8bb2f479509af817cf56fa7ea))
- Error thrown when cell overflow position is unknown ([#1177](https://github.com/deephaven/web-client-ui/issues/1177)) ([bb24f61](https://github.com/deephaven/web-client-ui/commit/bb24f61018c5af9325c3e3dc36abd63c3b10d51a)), closes [#1116](https://github.com/deephaven/web-client-ui/issues/1116)
- Goto Value Skips Rows on String Column, Displays Incorrect Filter, and `shift+enter` Doesn't go to Previous ([#1162](https://github.com/deephaven/web-client-ui/issues/1162)) ([e83d7c9](https://github.com/deephaven/web-client-ui/commit/e83d7c9f7265fc6402a347fa8826cef16ad3c93f)), closes [#1156](https://github.com/deephaven/web-client-ui/issues/1156) [#1157](https://github.com/deephaven/web-client-ui/issues/1157)
- Handling no columns ([#1170](https://github.com/deephaven/web-client-ui/issues/1170)) ([2ac25ae](https://github.com/deephaven/web-client-ui/commit/2ac25aed8afb51272c46050a1a0d278da9a87bc6)), closes [#1169](https://github.com/deephaven/web-client-ui/issues/1169)
- Scrolling horizontally in Linker mode renders empty cells ([#1160](https://github.com/deephaven/web-client-ui/issues/1160)) ([e314be6](https://github.com/deephaven/web-client-ui/commit/e314be6d32792aea3791ee5189fd45d37c86011c)), closes [#1146](https://github.com/deephaven/web-client-ui/issues/1146)

### Code Refactoring

- Fix fast refresh invalidations ([#1150](https://github.com/deephaven/web-client-ui/issues/1150)) ([2606826](https://github.com/deephaven/web-client-ui/commit/26068267c2cd67bc971b9537f8ce4108372167f5)), closes [#727](https://github.com/deephaven/web-client-ui/issues/727)
- TypeScript Type Improvements ([#1056](https://github.com/deephaven/web-client-ui/issues/1056)) ([0be0850](https://github.com/deephaven/web-client-ui/commit/0be0850a25e422150c61fbb7a6eff94614546f90)), closes [#1122](https://github.com/deephaven/web-client-ui/issues/1122)

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
- Selector Type removed from redux

# [0.32.0](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.32.0) (2023-03-10)

### Bug Fixes

- DH-12163 - Column grouping sidebar test failure fixes ([#1142](https://github.com/deephaven/web-client-ui/issues/1142)) ([a55308d](https://github.com/deephaven/web-client-ui/commit/a55308d736e98a730e4512a5b3c199f693d2a62b))
- Fixed rollup divider position ([#1125](https://github.com/deephaven/web-client-ui/issues/1125)) ([859bfa2](https://github.com/deephaven/web-client-ui/commit/859bfa290cf7bc5e920c6c8a02cbbc91f95b3999)), closes [#1062](https://github.com/deephaven/web-client-ui/issues/1062)
- Grid rendering header incorrectly when hiding all children in a group via layout hints ([#1139](https://github.com/deephaven/web-client-ui/issues/1139)) ([2fbccc6](https://github.com/deephaven/web-client-ui/commit/2fbccc60a7fe55264e7dceb260ba3962957a8eba)), closes [#1097](https://github.com/deephaven/web-client-ui/issues/1097)

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

- Add react-dom, redux and react-redux to remote component dependencies ([#1127](https://github.com/deephaven/web-client-ui/issues/1127)) ([d6c8a98](https://github.com/deephaven/web-client-ui/commit/d6c8a988d62157abfb8daadbff5db3eaef21a247))
- Added date time parsing for conditional formatting ([#1120](https://github.com/deephaven/web-client-ui/issues/1120)) ([4c7710e](https://github.com/deephaven/web-client-ui/commit/4c7710ece0d5cdfb3b196b06a396f2e760460ef9)), closes [#1108](https://github.com/deephaven/web-client-ui/issues/1108)
- Clicking a folder in file explorer panel sometimes fails to open or close it ([#1099](https://github.com/deephaven/web-client-ui/issues/1099)) ([7a7fc14](https://github.com/deephaven/web-client-ui/commit/7a7fc140d8721297bbdc17af879777b27f25269a)), closes [#1085](https://github.com/deephaven/web-client-ui/issues/1085)
- Conditional date formatting ([#1104](https://github.com/deephaven/web-client-ui/issues/1104)) ([2f503ba](https://github.com/deephaven/web-client-ui/commit/2f503bad83ef132b0cf9739803dc5014781a617b))
- Disable applying "No formatting" ([#1107](https://github.com/deephaven/web-client-ui/issues/1107)) ([14020f1](https://github.com/deephaven/web-client-ui/commit/14020f156c7a61fa48323fdb68c99f5161a4ff10)), closes [#1106](https://github.com/deephaven/web-client-ui/issues/1106)
- Fix the style guide ([#1119](https://github.com/deephaven/web-client-ui/issues/1119)) ([e4a75a1](https://github.com/deephaven/web-client-ui/commit/e4a75a1882335d1c4a3481005d7af8d9f2679f9a))
- Ordering of subplots ([#1111](https://github.com/deephaven/web-client-ui/issues/1111)) ([c4a3795](https://github.com/deephaven/web-client-ui/commit/c4a37951fbeb88297cbde92f0551d1272b41629f))
- Select Distinct Column Throws `null` error ([#1101](https://github.com/deephaven/web-client-ui/issues/1101)) ([144605a](https://github.com/deephaven/web-client-ui/commit/144605a533da29283aa5059f3f968402429c5e08)), closes [#1100](https://github.com/deephaven/web-client-ui/issues/1100)

### Features

- Goto Value Improvements ([#1072](https://github.com/deephaven/web-client-ui/issues/1072)) ([970a575](https://github.com/deephaven/web-client-ui/commit/970a57574145a6e44694dbac27b6938c8b4b1e9e)), closes [#1027](https://github.com/deephaven/web-client-ui/issues/1027)
- Improve text labels based on suggestions from chatGPT ([#1118](https://github.com/deephaven/web-client-ui/issues/1118)) ([d852e49](https://github.com/deephaven/web-client-ui/commit/d852e495a81c26a9273d6f8a72d4ea9fe9a04668))
- Instants and ZonedDateTimes should be treated as DateTimes ([#1117](https://github.com/deephaven/web-client-ui/issues/1117)) ([3900a2e](https://github.com/deephaven/web-client-ui/commit/3900a2e5b319bbc78c300b05fb21c9d529e81488)), closes [deephaven/deephaven-core#3385](https://github.com/deephaven/deephaven-core/issues/3385) [deephaven/deephaven-core#3455](https://github.com/deephaven/deephaven-core/issues/3455)
- isConfirmDangerProp ([#1110](https://github.com/deephaven/web-client-ui/issues/1110)) ([ffb7ada](https://github.com/deephaven/web-client-ui/commit/ffb7ada4814e03f9c4471e85319a6bb061943363)), closes [#1109](https://github.com/deephaven/web-client-ui/issues/1109)

## [0.30.1](https://github.com/deephaven/web-client-ui/compare/v0.30.0...v0.30.1) (2023-02-16)

### Bug Fixes

- add missing return for editvalueforcell, missing from TS conversion ([#1090](https://github.com/deephaven/web-client-ui/issues/1090)) ([1b00840](https://github.com/deephaven/web-client-ui/commit/1b00840886051bf2d7393185ecb8047fa977de49)), closes [#1087](https://github.com/deephaven/web-client-ui/issues/1087)
- DH-14240 hasHeaders false should hide header bar ([#1086](https://github.com/deephaven/web-client-ui/issues/1086)) ([28d97ad](https://github.com/deephaven/web-client-ui/commit/28d97ade8886c234f47a6413b5a1e93480d4e6a2))
- Remove default export in jsapi-types ([#1092](https://github.com/deephaven/web-client-ui/issues/1092)) ([7de114a](https://github.com/deephaven/web-client-ui/commit/7de114a057abea48a436cdb3fdd40bc04d3156f5))

# [0.30.0](https://github.com/deephaven/web-client-ui/compare/v0.29.1...v0.30.0) (2023-02-13)

### Features

- Import JS API as a module ([#1084](https://github.com/deephaven/web-client-ui/issues/1084)) ([9aab657](https://github.com/deephaven/web-client-ui/commit/9aab657ca674e404db6d3cf9b9c663627d635c2c)), closes [#444](https://github.com/deephaven/web-client-ui/issues/444)

### BREAKING CHANGES

- The JS API packaged as a module is now required for the
  `code-studio`, `embed-grid`, and `embed-chart` applications. Existing
  (Enterprise) applications should be able to use `jsapi-shim` still and
  load the JS API using the old method.

## [0.29.1](https://github.com/deephaven/web-client-ui/compare/v0.29.0...v0.29.1) (2023-02-10)

### Bug Fixes

- DH-14237: down arrow in console not returning to blank field ([#1082](https://github.com/deephaven/web-client-ui/issues/1082)) ([e15c125](https://github.com/deephaven/web-client-ui/commit/e15c1256a11576d1fa9f258f0c9c63d111adf664)), closes [#646](https://github.com/deephaven/web-client-ui/issues/646)

# [0.29.0](https://github.com/deephaven/web-client-ui/compare/v0.28.0...v0.29.0) (2023-02-03)

### Features

- Expandable rows shows tooltip ([#1068](https://github.com/deephaven/web-client-ui/issues/1068)) ([f2efc0a](https://github.com/deephaven/web-client-ui/commit/f2efc0ad24972ff1e9aa5887ec8bb871c9840a9c)), closes [#1061](https://github.com/deephaven/web-client-ui/issues/1061)
- Update ^ in shorcut to "Ctrl+" per windows guidelines ([#1069](https://github.com/deephaven/web-client-ui/issues/1069)) ([60c955a](https://github.com/deephaven/web-client-ui/commit/60c955a95f87b29d2347847849d128133bdc3b99))
- Use Conventional Commits for release management/PRs ([#1057](https://github.com/deephaven/web-client-ui/issues/1057)) ([aeaf940](https://github.com/deephaven/web-client-ui/commit/aeaf940b52b8a88322f4bcb9b7803c394937a28c))
