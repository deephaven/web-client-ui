enum OptionType {
  ADVANCED_SETTINGS = 'ADVANCED_SETTINGS',
  AGGREGATIONS = 'AGGREGATIONS',
  AGGREGATION_EDIT = 'AGGREGATIONS_EDIT',
  CHART_BUILDER = 'CHART_BUILDER',
  CUSTOM_COLUMN_BUILDER = 'CUSTOM_COLUMN_BUILDER',
  QUICK_FILTERS = 'QUICK_FILTERS',
  ROLLUP_ROWS = 'ROLLUP_ROWS',
  SEARCH_BAR = 'SEARCH_BAR',
  SELECT_DISTINCT = 'SELECT_DISTINCT',
  TABLE_EXPORTER = 'TABLE_EXPORTER',
  VISIBILITY_ORDERING_BUILDER = 'VISIBILITY_ORDERING_BUILDER',
  CONDITIONAL_FORMATTING = 'CONDITIONAL_FORMATTING',
  CONDITIONAL_FORMATTING_EDIT = 'CONDITIONAL_FORMATTING_EDIT',
  GOTO = 'GOTO',
}

/**
 * Key for a plugin-contributed sidebar entry, following the
 * `plugin:<plugin-name>:<id>` convention. Modeling it as a
 * template-literal type rather than a bare `string` keeps `OptionItemKey`
 * from collapsing to `string`, so `OptionType` autocomplete survives and
 * an un-namespaced key is rejected at compile time.
 */
export type PluginOptionKey = `plugin:${string}:${string}`;

/**
 * Identifier for a sidebar entry. Built-in entries use the closed
 * `OptionType` enum; plugin-supplied entries use a `PluginOptionKey`. The
 * page-switch distinguishes the two by the presence of `configPage` on the
 * `OptionItem`, not by inspecting the key.
 */
export type OptionItemKey = OptionType | PluginOptionKey;

export default OptionType;
