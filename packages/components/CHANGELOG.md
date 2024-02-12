# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.31.6](https://github.com/deephaven/web-client-ui/compare/v0.31.5...v0.31.6) (2024-02-12)

### Bug Fixes

- address chrome 121 scrollbar style behaviour change ([#1787](https://github.com/deephaven/web-client-ui/issues/1787)) ([#1789](https://github.com/deephaven/web-client-ui/issues/1789)) ([51e9b51](https://github.com/deephaven/web-client-ui/commit/51e9b5122d530dc282c938a2085e2fddbcc5520d))
- drag to re-arrange custom columns not working ([#1299](https://github.com/deephaven/web-client-ui/issues/1299)) ([#1302](https://github.com/deephaven/web-client-ui/issues/1302)) ([0984632](https://github.com/deephaven/web-client-ui/commit/09846327f76b906b534d5b97d33948b5a0f9d6e7)), closes [#1282](https://github.com/deephaven/web-client-ui/issues/1282) [#1013](https://github.com/deephaven/web-client-ui/issues/1013)

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
