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
 * (convention: `plugin:<plugin-name>:<id>`). See
 * `isPluginItemKey` for the runtime check used by the page switch.
 */
export type OptionItemKey = OptionType | string;

const BUILTIN_OPTION_TYPES = new Set<string>(Object.values(OptionType));

/**
 * Returns `true` iff `key` is a plugin-contributed sidebar key (i.e.
 * not a member of the built-in `OptionType` enum).
 */
export function isPluginItemKey(key: OptionItemKey): key is string {
  return !BUILTIN_OPTION_TYPES.has(key as string);
}

export default OptionType;
