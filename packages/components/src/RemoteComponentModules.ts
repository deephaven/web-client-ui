/**
 * Third-party module namespaces re-exported so the host app's remote
 * component resolve map can share its single bundled copy with plugins,
 * without each consumer (e.g. `@deephaven/app-utils`) having to depend on
 * the package directly.
 *
 * `@deephaven/components` owns both `@fortawesome/react-fontawesome` and
 * `@fortawesome/fontawesome-svg-core`, so re-exporting from here also
 * guarantees plugins share the exact FontAwesome instance whose global
 * registry/config the design system has already initialized.
 */
export * as ReactFontAwesome from '@fortawesome/react-fontawesome';
