## Custom Grid Renderer

You can customize how the grid is drawn by extending the GridRenderer class and overriding its methods. This gives you full control over the rendering pipeline—from background layers to headers and cell content.

In the example below, we override the drawCanvas method to control exactly which parts of the grid are rendered. See [GridRenderer](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridRenderer.ts) for full list of properties and methods.


```jsx live noInline
const model = new MockGridModel();

class CustomGridRenderer extends GridRenderer {
  drawCanvas(state: GridRenderState): void {
    const { context } = state;

    context.save();

    this.configureContext(context, state);

    this.drawBackground(context, state);

    this.drawGrid(context, state);

    this.drawHeaders(context, state);

    this.drawFooters(context, state);

    this.drawDraggingColumn(context, state);

    this.drawDraggingRow(context, state);

    // this.drawScrollBars(context, state);

    context.restore();
  }
}

const myRenderer = new CustomGridRenderer();

render(<Grid model={model} renderer={myRenderer} />);
```

If you need to pass custom values into your GridRenderer, you can use the stateOverride prop. This object is merged into the render state and is accessible from within any renderer method—ideal for passing dynamic styling or rendering flags.


```jsx live noInline
const model = new MockGridModel();

class CustomGridRenderer extends GridRenderer {
  drawCanvas(state: GridRenderState): void {
    const { context, width, height, stateOverride } = state;

    context.save();

    this.configureContext(context, state);
    this.drawBackground(context, state);
    this.drawGrid(context, state);
    this.drawHeaders(context, state);
    this.drawFooters(context, state);
    this.drawDraggingColumn(context, state);
    this.drawDraggingRow(context, state);

    context.restore();
  }
}

const myRenderer = new CustomGridRenderer();

render(
  <Grid
    model={model}
    renderer={myRenderer}
    stateOverride={{ highlight: true }}
  />
);
```
