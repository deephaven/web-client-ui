/**
 * Re-exports third-party module namespaces so plugins share the host app's
 * single bundled copy via the remote component resolve map.
 *
 * `@deephaven/iris-grid` owns the `@dnd-kit/*` packages, so re-exporting them
 * here lets grid-related plugins share the same dnd-kit instances.
 */
export * as DndKitCore from '@dnd-kit/core';
export * as DndKitSortable from '@dnd-kit/sortable';
export * as DndKitUtilities from '@dnd-kit/utilities';
