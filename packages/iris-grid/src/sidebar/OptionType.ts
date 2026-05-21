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
 * Identifier for a sidebar entry. Built-in entries use the closed
 * `OptionType` enum; plugin-supplied entries use a namespaced string
 * (convention: `plugin:<plugin-name>:<id>`). The page-switch
 * distinguishes the two by the presence of `configPage` on the
 * `OptionItem`, not by inspecting the key.
 */
export type OptionItemKey = OptionType | string;

export default OptionType;
