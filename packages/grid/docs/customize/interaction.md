# How to customize interaction

You can customize mouse and keyboard events in Grid by passing in your own mouse and keyboard handlers. By passing in custom handlers, you can determine the behavior of mouse and keyboard events.

In this example below, we display an alert whenever a cell is double-clicked or whenever a key is pressed.

```jsx live noInline
const model = new MockGridModel();
class CustomMouseHandler extends GridMouseHandler {
  onDoubleClick(gridPoint) {
    alert(`Double clicked: (${gridPoint.column}, ${gridPoint.row})`);
    return true;
  }
}
class CustomKeyHandler extends KeyHandler {
  onDown(event) {
    alert(`Key pressed: ${event.key}`);
    return true;
  }
}
const myMouseHandler = new CustomMouseHandler();
const myKeyHandler = new CustomKeyHandler();
render(
  <Grid
    model={model}
    mouseHandlers={[myMouseHandler]}
    keyHandlers={[myKeyHandler]}
  />
);
```

In addition to adding your own custom behaviour, it's possible to override existing behaviour. When a mouse or keyboard event occurs, Grid will iterate through all registered handlers, sorted by their specified `order`. If a handler returns `true`, Grid will stop iterating and not call any other handlers. If no handler returns `true`, Grid will continue to the next handler in the list.

For example, if you want to prevent the default behaviour of selecting a cell when it is clicked, you can return `true` in the `onClick` method of your custom mouse handler.

```jsx live noInline
const model = new MockGridModel();
class CustomMouseHandler extends GridMouseHandler {
  onDown(gridPoint) {
    if (gridPoint.column % 2 === 0 || gridPoint.row % 2 === 0) {
      alert(
        `Clicked even column or row: (${gridPoint.column}, ${gridPoint.row})`
      );
      return true;
    }
    return false;
  }
}

// Set order to 10 to ensure this handler is called before the default handler
const myMouseHandler = new CustomMouseHandler(50);
render(<Grid model={model} mouseHandlers={[myMouseHandler]} />);
```

## Tracking Column Movement

Use these callbacks to monitor column drag operations. `onMovedColumnsChanged` fires continuously while dragging, and `onMoveColumnComplete` runs once when the move finishes.

```jsx live
function Example() {
  const [model] = useState(() => new MockGridModel({ columnCount: 10 }));

  return (
    <Grid
      model={model}
      onMovedColumnsChanged={(movedColumns) =>
        console.log('Dragging columns:', movedColumns)
      }
      onMoveColumnComplete={(movedColumns) =>
        console.log('Finished moving columns:', movedColumns)
      }
    />
  );
}
```

## Tracking Row Movement

These props track row reordering. Use `onMovedRowsChanged` for live updates and `onMoveRowComplete` for the final state.

```jsx live
function Example() {
  const [model] = useState(() => new MockGridModel({ rowCount: 100 }));

  return (
    <Grid
      model={model}
      onMovedRowsChanged={(movedRows) =>
        console.log('Dragging rows:', movedRows)
      }
      onMoveRowComplete={(movedRows) =>
        console.log('Finished moving rows:', movedRows)
      }
    />
  );
}
```

## Responding to Selection Changes

This prop helps track what users select in the grid.

```jsx live
function Example() {
  const [model] = useState(() => new MockGridModel({ rowCount: 100, columnCount: 10 }));

  return (
    <Grid
      model={model}
      onSelectionChanged={(ranges) =>
        console.log('User selected new range:', ranges)
      }
    />
  );
}
```

## Monitoring Viewport Changes

Use this to detect scrolling or viewport shifts—ideal for performance optimizations or lazy loading.

```jsx live
function Example() {
  const [model] = useState(() => new MockGridModel({ rowCount: 1000 }));

  return (
    <Grid
      model={model}
      onViewChanged={(metrics) =>
        console.log('Viewport updated:', metrics)
      }
    />
  );
}
```

## Handling Token Clicks

This callback responds to token interactions inside the grid.

```jsx live
function Example() {
  const [model] = useState(() => new MockGridModel({ rowCount: 50 }));

  return (
    <Grid
      model={model}
      onTokenClicked={(token) =>
        console.log('User clicked a token:', token)
      }
    />
  );
}
```

