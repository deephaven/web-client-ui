/**
 * Registers all built-in table options with the default registry.
 * Import this file to populate the registry with built-in options.
 */
import { defaultTableOptionsRegistry } from './TableOptionsRegistry';
import { SelectDistinctOption } from './options/SelectDistinctOption';
import { CustomColumnOption } from './options/CustomColumnOption';
import { RollupRowsOption } from './options/RollupRowsOption';
import { VisibilityOrderingOption } from './options/VisibilityOrderingOption';
import { AggregationsOption } from './options/AggregationsOption';
import { TableExporterOption } from './options/TableExporterOption';
import { ConditionalFormattingOption } from './options/ConditionalFormattingOption';
import { ChartBuilderOption } from './options/ChartBuilderOption';
import { AdvancedSettingsOption } from './options/AdvancedSettingsOption';
import { QuickFiltersOption } from './options/QuickFiltersOption';
import { SearchBarOption } from './options/SearchBarOption';
import { GotoRowOption } from './options/GotoRowOption';

/**
 * Register all built-in options with the default registry.
 * Call this once at application startup.
 */
export function registerBuiltinOptions(): void {
  defaultTableOptionsRegistry.registerAll([
    // Phase B: Low-complexity options
    SelectDistinctOption,
    CustomColumnOption,
    RollupRowsOption,

    // Phase C: Medium-complexity options
    VisibilityOrderingOption,
    AggregationsOption,

    // Phase D: High-complexity options
    TableExporterOption,
    ConditionalFormattingOption,
    ChartBuilderOption,
    AdvancedSettingsOption,

    // Toggle options
    QuickFiltersOption,
    SearchBarOption,
    GotoRowOption,
  ]);
}

// Auto-register when this module is imported
registerBuiltinOptions();

export { defaultTableOptionsRegistry };
