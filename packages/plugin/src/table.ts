// Separate entry point so the root declarations never reference `@deephaven/iris-grid`
// or `@deephaven/grid`, which are optional peers.
export * from './TablePlugin';
