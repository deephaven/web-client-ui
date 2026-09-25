# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.30.0](https://github.com/deephaven/web-client-ui/compare/v1.29.1...v1.30.0) (2026-09-25)

### ⚠ BREAKING CHANGES

- `@deephaven/grid` and `@deephaven/iris-grid` are no
  longer
  installed transitively by `@deephaven/plugin`. Consumers that use the
  table
  plugin types (`TablePluginProps`, `TablePluginElement`,
  `TablePluginComponent`) must declare those packages themselves; without
  them
  the referenced types resolve to `any` under `skipLibCheck`.

### Build System

- DH-23702: make grid and iris-grid optional peers of @deephaven/plugin ([#2757](https://github.com/deephaven/web-client-ui/issues/2757)) ([6692d46](https://github.com/deephaven/web-client-ui/commit/6692d46627b09993c3b84daebe327b9f63feeb78))

## [1.29.0](https://github.com/deephaven/web-client-ui/compare/v1.28.1...v1.29.0) (2026-09-11)

### Features

- grid accessibility content on demand, playwright-grid testing package ([#2742](https://github.com/deephaven/web-client-ui/issues/2742)) ([7111518](https://github.com/deephaven/web-client-ui/commit/71115181cf56c1a010bd165818371c13d786f84c))
