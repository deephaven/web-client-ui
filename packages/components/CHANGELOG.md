# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)


### Features

* Theming - Moved ThemeProvider updates into effect ([#1682](https://github.com/deephaven/web-client-ui/issues/1682)) ([a09bdca](https://github.com/deephaven/web-client-ui/commit/a09bdcaebc692a07ad6b243bd93f7cbd62c61a74)), closes [#1669](https://github.com/deephaven/web-client-ui/issues/1669)





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)


### Bug Fixes

* add right margin to <Button kind='inline'/> using icons ([#1664](https://github.com/deephaven/web-client-ui/issues/1664)) ([fd8a6c6](https://github.com/deephaven/web-client-ui/commit/fd8a6c65d64b93ba69849b6053d5bbbd9d72c4dc))
* adjust filter bar colour ([#1666](https://github.com/deephaven/web-client-ui/issues/1666)) ([4c0200e](https://github.com/deephaven/web-client-ui/commit/4c0200e71e350fcf5261b0cc28440cb798bec207))


### Features

* Add embed-widget ([#1668](https://github.com/deephaven/web-client-ui/issues/1668)) ([1b06675](https://github.com/deephaven/web-client-ui/commit/1b06675e54b3dd4802078f9904408b691619611f)), closes [#1629](https://github.com/deephaven/web-client-ui/issues/1629)
* forward and back button for organize column search ([#1641](https://github.com/deephaven/web-client-ui/issues/1641)) ([89f2be5](https://github.com/deephaven/web-client-ui/commit/89f2be56647c977e4150f050ceec9e33f4c07680)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)
* theme fontawesome icon size wrapped in spectrum icons ([#1658](https://github.com/deephaven/web-client-ui/issues/1658)) ([2aa8cef](https://github.com/deephaven/web-client-ui/commit/2aa8cef6ce5a419b20c8a74d107bd523156d8ea4))
* Theme Selector ([#1661](https://github.com/deephaven/web-client-ui/issues/1661)) ([5e2be64](https://github.com/deephaven/web-client-ui/commit/5e2be64bfa93c5aff8aa936d3de476eccde0a6e7)), closes [#1660](https://github.com/deephaven/web-client-ui/issues/1660)
* Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))
* Theming - Inline svgs ([#1651](https://github.com/deephaven/web-client-ui/issues/1651)) ([1e40d3e](https://github.com/deephaven/web-client-ui/commit/1e40d3e5a1078c555d55aa0a00c66a8b95dadfee))


### BREAKING CHANGES

* Bootstrap color variables are now predominantly hsl
based. SCSS will need to be updated accordingly. Theme providers are
needed to load themes.





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)


### Features

* forward and back buttons for organize column search ([#1620](https://github.com/deephaven/web-client-ui/issues/1620)) ([75cf184](https://github.com/deephaven/web-client-ui/commit/75cf184f4b4b9d9a771544ea6335e5d2733368d9)), closes [#1529](https://github.com/deephaven/web-client-ui/issues/1529)


### Reverts

* feat: forward and back buttons for organize column search ([#1640](https://github.com/deephaven/web-client-ui/issues/1640)) ([737d1aa](https://github.com/deephaven/web-client-ui/commit/737d1aa98d04800377035d7d189219fefacfa23f))





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)


### Bug Fixes

* Date argument non-optional for the onChange prop ([#1622](https://github.com/deephaven/web-client-ui/issues/1622)) ([9a960b3](https://github.com/deephaven/web-client-ui/commit/9a960b3a50eed904fce61d3e97307261582a1de7)), closes [#1601](https://github.com/deephaven/web-client-ui/issues/1601)
* Fixing grid colors and grays ([#1621](https://github.com/deephaven/web-client-ui/issues/1621)) ([9ab2b1e](https://github.com/deephaven/web-client-ui/commit/9ab2b1e3204c7f854b8526e510b1e5a5fc59b8f6)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)


### Features

* Theming - Charts ([#1608](https://github.com/deephaven/web-client-ui/issues/1608)) ([d5b3b48](https://github.com/deephaven/web-client-ui/commit/d5b3b485dfc95248bdd1d664152c6c1ab288720a)), closes [#1572](https://github.com/deephaven/web-client-ui/issues/1572)


### BREAKING CHANGES

* - ChartThemeProvider is now required to provide ChartTheme
- ChartModelFactory and ChartUtils now require chartTheme args





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)


### Features

* Babel Plugin - Mock css imports ([#1607](https://github.com/deephaven/web-client-ui/issues/1607)) ([787c542](https://github.com/deephaven/web-client-ui/commit/787c5420ecb90661ae5032e174f292707e908820)), closes [#1606](https://github.com/deephaven/web-client-ui/issues/1606)





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)


### Bug Fixes

* Theming - switched from ?inline to ?raw css imports ([#1600](https://github.com/deephaven/web-client-ui/issues/1600)) ([f6d0874](https://github.com/deephaven/web-client-ui/commit/f6d0874a98cc7377c3857a44930b5c636b72ca1f)), closes [#1599](https://github.com/deephaven/web-client-ui/issues/1599)


### BREAKING CHANGES

* Theme css imports were switched from `?inline` to
`?raw`. Not likely that we have any consumers yet, but this would impact
webpack config.





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Bug Fixes

* Adjusted Monaco "white" colors ([#1594](https://github.com/deephaven/web-client-ui/issues/1594)) ([c736708](https://github.com/deephaven/web-client-ui/commit/c736708e0dd39aa1d0f171f1e9ecf69023647021)), closes [#1592](https://github.com/deephaven/web-client-ui/issues/1592)


### Features

* Theming - Spectrum Provider ([#1582](https://github.com/deephaven/web-client-ui/issues/1582)) ([a4013c0](https://github.com/deephaven/web-client-ui/commit/a4013c0b83347197633a008b2b56006c8da12a46)), closes [#1543](https://github.com/deephaven/web-client-ui/issues/1543)
* Theming Iris Grid ([#1568](https://github.com/deephaven/web-client-ui/issues/1568)) ([ed8f4b7](https://github.com/deephaven/web-client-ui/commit/ed8f4b7e45131c1d862d00ac0f8ff604114bba90))


### BREAKING CHANGES

* Enterprise will need ThemeProvider for the css
variables to be available





# [0.50.0](https://github.com/deephaven/web-client-ui/compare/v0.49.1...v0.50.0) (2023-10-13)


* fix!: CSS based loading spinner (#1532) ([f06fbb0](https://github.com/deephaven/web-client-ui/commit/f06fbb01e27eaaeccab6031d8ff010ffee303d99)), closes [#1532](https://github.com/deephaven/web-client-ui/issues/1532) [#1531](https://github.com/deephaven/web-client-ui/issues/1531)


### Features

* Monaco theming ([#1560](https://github.com/deephaven/web-client-ui/issues/1560)) ([4eda17c](https://github.com/deephaven/web-client-ui/commit/4eda17c82f6c177a11ba600d6f43c4f36915f6bd)), closes [#1542](https://github.com/deephaven/web-client-ui/issues/1542)
* Theme Plugin Loading ([#1524](https://github.com/deephaven/web-client-ui/issues/1524)) ([a9541b1](https://github.com/deephaven/web-client-ui/commit/a9541b108f1d998bb2713e70642f5a54aaf8bd97)), closes [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1a171](https://github.com/deephaven/web-client-ui/issues/1a171) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#4c7](https://github.com/deephaven/web-client-ui/issues/4c7) [#1530](https://github.com/deephaven/web-client-ui/issues/1530)


### BREAKING CHANGES

* Theme variables have to be present on body to avoid
Monaco init failing
* Inline LoadingSpinner instances will need to be
decorated with `className="loading-spinner-vertical-align"` for vertical
alignment to work as before





## [0.49.1](https://github.com/deephaven/web-client-ui/compare/v0.49.0...v0.49.1) (2023-09-27)


### Bug Fixes

* Right clicking with a custom context menu open should open another context menu ([#1526](https://github.com/deephaven/web-client-ui/issues/1526)) ([bd08e1f](https://github.com/deephaven/web-client-ui/commit/bd08e1fa50d938a94ead82f55b365b7c00e8d8f0)), closes [#1525](https://github.com/deephaven/web-client-ui/issues/1525)





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/components





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/components





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)


### Features

* adds copy file support to file explorer and fixes rename bug ([#1491](https://github.com/deephaven/web-client-ui/issues/1491)) ([d35aa49](https://github.com/deephaven/web-client-ui/commit/d35aa495f2ee2f17a9053c46a13e5982614bed6c)), closes [#185](https://github.com/deephaven/web-client-ui/issues/185) [#1375](https://github.com/deephaven/web-client-ui/issues/1375) [#1488](https://github.com/deephaven/web-client-ui/issues/1488)





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
