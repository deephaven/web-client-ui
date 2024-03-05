# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.67.0](https://github.com/deephaven/web-client-ui/compare/v0.66.1...v0.67.0) (2024-03-04)

**Note:** Version bump only for package @deephaven/utils





# [0.66.0](https://github.com/deephaven/web-client-ui/compare/v0.65.0...v0.66.0) (2024-02-27)

**Note:** Version bump only for package @deephaven/utils





# [0.65.0](https://github.com/deephaven/web-client-ui/compare/v0.64.0...v0.65.0) (2024-02-20)


### Features

* Test Utils - Generate exhaustive boolean combinations and MockProxy spread ([#1811](https://github.com/deephaven/web-client-ui/issues/1811)) ([0a2f054](https://github.com/deephaven/web-client-ui/commit/0a2f054591d04dd32c4919ce90fd538638e0b563)), closes [#1809](https://github.com/deephaven/web-client-ui/issues/1809)





# [0.64.0](https://github.com/deephaven/web-client-ui/compare/v0.63.0...v0.64.0) (2024-02-15)

**Note:** Version bump only for package @deephaven/utils





# [0.63.0](https://github.com/deephaven/web-client-ui/compare/v0.62.0...v0.63.0) (2024-02-08)


### Features

* multiselect values ([#1736](https://github.com/deephaven/web-client-ui/issues/1736)) ([e6955c1](https://github.com/deephaven/web-client-ui/commit/e6955c1b330ae09d3bfbe3bbcb6d1bf303ea9b48)), closes [#1233](https://github.com/deephaven/web-client-ui/issues/1233)





# [0.62.0](https://github.com/deephaven/web-client-ui/compare/v0.61.1...v0.62.0) (2024-02-05)

**Note:** Version bump only for package @deephaven/utils





# [0.61.0](https://github.com/deephaven/web-client-ui/compare/v0.60.0...v0.61.0) (2024-02-01)


### Features

* allow themes to use any srgb color for definitions ([#1756](https://github.com/deephaven/web-client-ui/issues/1756)) ([b047fa3](https://github.com/deephaven/web-client-ui/commit/b047fa36de3a285be925736ef73722a60d1d9ed7))


### BREAKING CHANGES

* - IrisGridThemeContext no longer accepts a paritial theme. By
guaranteeing the provider is a full theme we can resolve the CSS
variables and normailze the colors only once per theme load globally,
rather than having to do it once per grid.
- Themes must be defined using valid srgb CSS colors, and not hsl raw
component values





# [0.60.0](https://github.com/deephaven/web-client-ui/compare/v0.59.0...v0.60.0) (2024-01-26)

**Note:** Version bump only for package @deephaven/utils





# [0.59.0](https://github.com/deephaven/web-client-ui/compare/v0.58.0...v0.59.0) (2024-01-17)

**Note:** Version bump only for package @deephaven/utils





# [0.58.0](https://github.com/deephaven/web-client-ui/compare/v0.57.1...v0.58.0) (2023-12-22)

**Note:** Version bump only for package @deephaven/utils





# [0.57.0](https://github.com/deephaven/web-client-ui/compare/v0.56.0...v0.57.0) (2023-12-13)


### Bug Fixes

* Made selector return types generic ([#1688](https://github.com/deephaven/web-client-ui/issues/1688)) ([b2972f0](https://github.com/deephaven/web-client-ui/commit/b2972f0dbf9e662eec6326acc6855aa1ddc85c41)), closes [#1687](https://github.com/deephaven/web-client-ui/issues/1687)





# [0.56.0](https://github.com/deephaven/web-client-ui/compare/v0.55.0...v0.56.0) (2023-12-11)


### Features

* Theming - Bootstrap ([#1603](https://github.com/deephaven/web-client-ui/issues/1603)) ([88bcae0](https://github.com/deephaven/web-client-ui/commit/88bcae02791776464c2f774653764fb479d28700))


### BREAKING CHANGES

* Bootstrap color variables are now predominantly hsl
based. SCSS will need to be updated accordingly. Theme providers are
needed to load themes.





# [0.55.0](https://github.com/deephaven/web-client-ui/compare/v0.54.0...v0.55.0) (2023-11-20)

**Note:** Version bump only for package @deephaven/utils





# [0.54.0](https://github.com/deephaven/web-client-ui/compare/v0.53.0...v0.54.0) (2023-11-10)


### Bug Fixes

* Infinite loop with grid rendering ([#1631](https://github.com/deephaven/web-client-ui/issues/1631)) ([4875d2e](https://github.com/deephaven/web-client-ui/commit/4875d2e1e895478720950ad73f28d1b895114a58)), closes [#1626](https://github.com/deephaven/web-client-ui/issues/1626)





# [0.53.0](https://github.com/deephaven/web-client-ui/compare/v0.52.0...v0.53.0) (2023-11-03)

**Note:** Version bump only for package @deephaven/utils





# [0.52.0](https://github.com/deephaven/web-client-ui/compare/v0.51.0...v0.52.0) (2023-10-27)

**Note:** Version bump only for package @deephaven/utils





# [0.51.0](https://github.com/deephaven/web-client-ui/compare/v0.50.0...v0.51.0) (2023-10-24)


### Features

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





# [0.49.0](https://github.com/deephaven/web-client-ui/compare/v0.48.0...v0.49.0) (2023-09-15)

**Note:** Version bump only for package @deephaven/utils





# [0.48.0](https://github.com/deephaven/web-client-ui/compare/v0.47.0...v0.48.0) (2023-09-12)

**Note:** Version bump only for package @deephaven/utils





# [0.47.0](https://github.com/deephaven/web-client-ui/compare/v0.46.1...v0.47.0) (2023-09-08)


### Features

* bindAllMethods util function ([#1476](https://github.com/deephaven/web-client-ui/issues/1476)) ([0dab8d7](https://github.com/deephaven/web-client-ui/commit/0dab8d70f299441271fe7047f9d4f2eb48a6d8be)), closes [#1474](https://github.com/deephaven/web-client-ui/issues/1474)





## [0.46.1](https://github.com/deephaven/web-client-ui/compare/v0.46.0...v0.46.1) (2023-09-01)


### Bug Fixes

* Heap usage request throttling ([#1450](https://github.com/deephaven/web-client-ui/issues/1450)) ([5cc2936](https://github.com/deephaven/web-client-ui/commit/5cc2936332a993c633d9f2f5087b68c98a1e5f97)), closes [#1439](https://github.com/deephaven/web-client-ui/issues/1439) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5) [#6](https://github.com/deephaven/web-client-ui/issues/6) [#7](https://github.com/deephaven/web-client-ui/issues/7) [#8](https://github.com/deephaven/web-client-ui/issues/8) [#9](https://github.com/deephaven/web-client-ui/issues/9) [#10](https://github.com/deephaven/web-client-ui/issues/10) [#11](https://github.com/deephaven/web-client-ui/issues/11) [#12](https://github.com/deephaven/web-client-ui/issues/12) [#13](https://github.com/deephaven/web-client-ui/issues/13) [#14](https://github.com/deephaven/web-client-ui/issues/14) [#15](https://github.com/deephaven/web-client-ui/issues/15) [#16](https://github.com/deephaven/web-client-ui/issues/16) [#17](https://github.com/deephaven/web-client-ui/issues/17) [#18](https://github.com/deephaven/web-client-ui/issues/18) [#19](https://github.com/deephaven/web-client-ui/issues/19) [#20](https://github.com/deephaven/web-client-ui/issues/20) [#21](https://github.com/deephaven/web-client-ui/issues/21) [#22](https://github.com/deephaven/web-client-ui/issues/22) [#23](https://github.com/deephaven/web-client-ui/issues/23) [#24](https://github.com/deephaven/web-client-ui/issues/24) [#25](https://github.com/deephaven/web-client-ui/issues/25) [#26](https://github.com/deephaven/web-client-ui/issues/26) [#27](https://github.com/deephaven/web-client-ui/issues/27) [#1](https://github.com/deephaven/web-client-ui/issues/1) [#2](https://github.com/deephaven/web-client-ui/issues/2) [#3](https://github.com/deephaven/web-client-ui/issues/3) [#4](https://github.com/deephaven/web-client-ui/issues/4) [#5](https://github.com/deephaven/web-client-ui/issues/5)





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
