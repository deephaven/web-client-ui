# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.31.5](https://github.com/deephaven/web-client-ui/compare/v0.31.4...v0.31.5) (2023-04-20)

### Features

- Display workerName and processInfoId in the console status bar … ([#1218](https://github.com/deephaven/web-client-ui/issues/1218)) ([20e41a4](https://github.com/deephaven/web-client-ui/commit/20e41a4c0b3550f69e961ed99cf39c219da682a6)), closes [#1173](https://github.com/deephaven/web-client-ui/issues/1173)

## [0.31.4](https://github.com/deephaven/web-client-ui/compare/v0.31.2...v0.31.4) (2023-04-03)

**Note:** Version bump only for package @deephaven/code-studio

## [0.31.3](https://github.com/deephaven/web-client-ui/compare/v0.31.2...v0.31.3) (2023-03-30)

**Note:** Version bump only for package @deephaven/code-studio

## [0.31.2](https://github.com/deephaven/web-client-ui/compare/v0.31.1...v0.31.2) (2023-03-22)

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
