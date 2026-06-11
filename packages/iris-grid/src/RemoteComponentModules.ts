/**
 * Third-party module namespaces re-exported so the host app's remote
 * component resolve map can share its single bundled copy with plugins,
 * without each consumer (e.g. `@deephaven/app-utils`) having to depend on
 * the package directly.
 *
 * `@deephaven/iris-grid` owns the `@dnd-kit/*` packages (used by the
 * visibility-ordering drag-reorder UI), so re-exporting from here lets
 * grid-related plugins share the exact same dnd-kit instances.
 */
export * as DndKitCore from '@dnd-kit/core';
export * as DndKitSortable from '@dnd-kit/sortable';
export * as DndKitUtilities from '@dnd-kit/utilities';
