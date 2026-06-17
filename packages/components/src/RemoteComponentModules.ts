/**
 * Re-exports third-party module namespaces so plugins share the host app's
 * single bundled copy via the remote component resolve map.
 *
 * `@deephaven/components` owns FontAwesome, so re-exporting it here ensures
 * plugins use the same instance the design system has already initialized.
 */
export * as ReactFontAwesome from '@fortawesome/react-fontawesome';
