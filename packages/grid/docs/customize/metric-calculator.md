## Metric Calculator

You can customize how the grid calculates dimensions and positioning by extending the GridMetricCalculator class and overriding its methods. This gives you full control over spacing, sizing, and layout calculations—from row heights and column widths to grid positioning and accessibility enhancements.

In the example below, we override methods like `getVisibleRowHeight()` and `calculateColumnWidth()` to implement accessibility features such as larger touch targets and high contrast spacing. See [GridMetricCalculator](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridMetricCalculator.ts) for full list of properties and methods.

```jsx live noInline
class AccessibilityGridCalculator extends GridMetricCalculator {
  constructor(options = {}) {
    super(options);
    this.accessibilityMode = options.accessibilityMode || 'normal';
    this.highContrastMode = options.highContrastMode || false;
  }

  getGridX(state) {
    const baseX = super.getGridX(state);

    // Add extra spacing in high contrast mode
    if (this.highContrastMode) {
      return baseX + 4;
    }

    return baseX;
  }

  getGridY(state) {
    const baseY = super.getGridY(state);

    // Add extra spacing in high contrast mode
    if (this.highContrastMode) {
      return baseY + 4;
    }

    return baseY;
  }

  getVisibleRowHeight(row, state) {
    const baseHeight = super.getVisibleRowHeight(row, state);

    // Increase touch targets for accessibility
    if (this.accessibilityMode === 'large') {
      return Math.max(baseHeight, 44); // WCAG recommended minimum
    }

    return baseHeight;
  }

  calculateColumnWidth(column, modelColumn, state, firstColumn, treePaddingX) {
    const baseWidth = super.calculateColumnWidth(
      column,
      modelColumn,
      state,
      firstColumn,
      treePaddingX
    );

    // Add minimum width for accessibility
    if (this.accessibilityMode === 'large') {
      return Math.max(baseWidth, 120);
    }

    return baseWidth;
  }
}

const myGridMetricCalculator = new AccessibilityGridCalculator({
  accessibilityMode: 'large',
  highContrastMode: true,
});
const model = new MockGridModel();

render(<Grid model={model} metricCalculator={myGridMetricCalculator} />);
```
