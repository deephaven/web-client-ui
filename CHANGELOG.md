# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.31.6](https://github.com/deephaven/web-client-ui/compare/v0.31.5...v0.31.6) (2024-02-12)

### Bug Fixes

- address chrome 121 scrollbar style behaviour change ([#1787](https://github.com/deephaven/web-client-ui/issues/1787)) ([#1789](https://github.com/deephaven/web-client-ui/issues/1789)) ([51e9b51](https://github.com/deephaven/web-client-ui/commit/51e9b5122d530dc282c938a2085e2fddbcc5520d))
- drag to re-arrange custom columns not working ([#1299](https://github.com/deephaven/web-client-ui/issues/1299)) ([#1302](https://github.com/deephaven/web-client-ui/issues/1302)) ([0984632](https://github.com/deephaven/web-client-ui/commit/09846327f76b906b534d5b97d33948b5a0f9d6e7)), closes [#1282](https://github.com/deephaven/web-client-ui/issues/1282) [#1013](https://github.com/deephaven/web-client-ui/issues/1013)

## [0.31.5](https://github.com/deephaven/web-client-ui/compare/v0.31.4...v0.31.5) (2023-04-20)

### Bug Fixes

- Fix OneClick links not filtering plots ([#1217](https://github.com/deephaven/web-client-ui/issues/1217)) ([#1232](https://github.com/deephaven/web-client-ui/issues/1232)) ([6b2be01](https://github.com/deephaven/web-client-ui/commit/6b2be01ce7fd9e9c6863f853f187c370062dc53a)), closes [#1198](https://github.com/deephaven/web-client-ui/issues/1198)

### Features

- Display workerName and processInfoId in the console status bar … ([#1218](https://github.com/deephaven/web-client-ui/issues/1218)) ([20e41a4](https://github.com/deephaven/web-client-ui/commit/20e41a4c0b3550f69e961ed99cf39c219da682a6)), closes [#1173](https://github.com/deephaven/web-client-ui/issues/1173)

## [0.31.4](https://github.com/deephaven/web-client-ui/compare/v0.31.2...v0.31.4) (2023-04-03)

### Bug Fixes

- DH-14436 Handling no columns ([#1170](https://github.com/deephaven/web-client-ui/issues/1170)) ([#1179](https://github.com/deephaven/web-client-ui/issues/1179)) ([a7498d5](https://github.com/deephaven/web-client-ui/commit/a7498d5e6580909f812b5ccea3f9cab6c96fe3e7)), closes [#1169](https://github.com/deephaven/web-client-ui/issues/1169)
- DH-14439 Fix QueryMonitor breaking on null in default search filter ([#1174](https://github.com/deephaven/web-client-ui/issues/1174)) ([ba18c7b](https://github.com/deephaven/web-client-ui/commit/ba18c7bdb3737443468c7dd222fc9fe7b7669789)), closes [#1159](https://github.com/deephaven/web-client-ui/issues/1159)
- Fix column data appearing incorrectly when multiplier null ([#1194](https://github.com/deephaven/web-client-ui/issues/1194)) ([#1196](https://github.com/deephaven/web-client-ui/issues/1196)) ([bd8cbfb](https://github.com/deephaven/web-client-ui/commit/bd8cbfbc23e5cc722ae7bb67177056f493678740)), closes [#1193](https://github.com/deephaven/web-client-ui/issues/1193) [#0](https://github.com/deephaven/web-client-ui/issues/0)

## [0.31.3](https://github.com/deephaven/web-client-ui/compare/v0.31.2...v0.31.3) (2023-03-30)

### Bug Fixes

- DH-14436 Handling no columns ([#1170](https://github.com/deephaven/web-client-ui/issues/1170)) ([#1179](https://github.com/deephaven/web-client-ui/issues/1179)) ([a7498d5](https://github.com/deephaven/web-client-ui/commit/a7498d5e6580909f812b5ccea3f9cab6c96fe3e7)), closes [#1169](https://github.com/deephaven/web-client-ui/issues/1169)
- DH-14439 Fix QueryMonitor breaking on null in default search filter ([#1174](https://github.com/deephaven/web-client-ui/issues/1174)) ([ba18c7b](https://github.com/deephaven/web-client-ui/commit/ba18c7bdb3737443468c7dd222fc9fe7b7669789)), closes [#1159](https://github.com/deephaven/web-client-ui/issues/1159)

## [0.31.2](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.31.2) (2023-03-22)

### Bug Fixes

- DH-12163 - Column grouping sidebar test failure fixes (cherry-pick) ([#1158](https://github.com/deephaven/web-client-ui/issues/1158)) ([e1960be](https://github.com/deephaven/web-client-ui/commit/e1960be82909b558a2740de00d78673a46051408))

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
