import type { TableOption, GridStateSnapshot } from './TableOption';

/**
 * Registry for Table Options.
 * Manages the collection of available options and provides methods
 * for plugins to register, unregister, and modify options.
 */
export class TableOptionsRegistry {
  private options = new Map<string, TableOption>();

  private listeners = new Set<() => void>();

  /**
   * Register a new table option.
   * @param option - The option to register
   */
  register(option: TableOption): void {
    this.options.set(option.type, option);
    this.notifyListeners();
  }

  /**
   * Register multiple options at once.
   * @param options - Array of options to register
   */
  registerAll(options: TableOption[]): void {
    options.forEach(option => {
      this.options.set(option.type, option);
    });
    this.notifyListeners();
  }

  /**
   * Unregister an option by type.
   * @param type - The option type to remove
   */
  unregister(type: string): void {
    this.options.delete(type);
    this.notifyListeners();
  }

  /**
   * Check if an option type is registered.
   * @param type - The option type to check
   */
  has(type: string): boolean {
    return this.options.has(type);
  }

  /**
   * Get an option by type.
   * @param type - The option type
   */
  get(type: string): TableOption | undefined {
    return this.options.get(type);
  }

  /**
   * Get all registered options, sorted by order.
   * @param gridState - Current grid state (for filtering visibility)
   */
  getOptions(gridState?: GridStateSnapshot): TableOption[] {
    const allOptions = [...this.options.values()];

    // Filter by visibility if grid state is provided
    const visibleOptions =
      gridState != null
        ? allOptions.filter(
            opt =>
              opt.menuItem.isVisible == null ||
              opt.menuItem.isVisible(gridState)
          )
        : allOptions;

    // Sort by order (default to 100 if not specified)
    return visibleOptions.sort(
      (a, b) => (a.menuItem.order ?? 100) - (b.menuItem.order ?? 100)
    );
  }

  /**
   * Modify an existing option.
   * Useful for plugins that want to change built-in options.
   * @param type - The option type to modify
   * @param modifier - Function that receives the current option and returns modified version
   */
  modify<T extends TableOption>(
    type: string,
    modifier: (option: T) => T
  ): void {
    const existing = this.options.get(type) as T | undefined;
    if (existing != null) {
      this.options.set(type, modifier(existing));
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to registry changes.
   * @param listener - Callback when options change
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Clear all registered options.
   * Mainly useful for testing.
   */
  clear(): void {
    this.options.clear();
    this.notifyListeners();
  }
}

/**
 * Default global registry instance.
 * Built-in options are registered here.
 */
export const defaultTableOptionsRegistry = new TableOptionsRegistry();

export default TableOptionsRegistry;
