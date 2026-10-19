# Editable grid

Grid supports editing cells, filling a selection with a value, and pasting from the clipboard. To enable editing, give Grid a model that implements [EditableGridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/EditableGridModel.ts). Grid treats any model that defines an `isEditable` property as editable.

## Minimal example

The model below stores its data in an array and accepts every edit. Double-click a cell, or select one and start typing, to edit it.

```tsx live noInline
class EditableModel extends GridModel implements EditableGridModel {
  private data: (string | number)[][];

  private columnHeaders: string[];

  constructor(data: (string | number)[][], columnHeaders: string[]) {
    super();
    this.data = data;
    this.columnHeaders = columnHeaders;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.columnHeaders.length;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return `${this.data[row][column]}`;
  }

  textForColumnHeader(column: ModelIndex): string {
    return this.columnHeaders[column];
  }

  get isEditable(): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    return true;
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    return true;
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textForCell(column, row);
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    await this.setValues([{ column, row, text: value }]);
  }

  async setValueForRanges(
    ranges: readonly GridRange[],
    value: string
  ): Promise<void> {
    const edits: EditOperation[] = [];
    GridRange.forEachCell(
      GridRange.boundedRanges(ranges, this.columnCount, this.rowCount),
      (column, row) => edits.push({ column, row, text: value })
    );
    await this.setValues(edits);
  }

  async setValues(edits: readonly EditOperation[]): Promise<void> {
    edits.forEach(({ column, row, text }) => {
      this.data[row][column] = text;
    });
  }
}

function EditableGridExample(): JSX.Element {
  const model = useMemo(
    () =>
      new EditableModel(
        [
          ['Matthew Austins', 'Toronto', 35, 22],
          ['Doug Millgore', 'Toronto', 14, 33],
          ['Bart Marchant', 'Boston', 20, 14],
          ['Luigi Dabest', 'Pittsburgh', 66, 33],
        ],
        ['Name', 'Team', 'Goals', 'Assists']
      ),
    []
  );

  return <Grid model={model} />;
}

render(<EditableGridExample />);
```

A few things to note:

- Grid redraws after the user edits a cell, but it doesn't listen for changes to the model's data. If the data changes at any other time, such as when an asynchronous save completes, call `forceUpdate()` on the Grid to redraw it. See [Saving to a server](#saving-to-a-server).
- Ranges can be unbounded. For example, selecting all with <kbd>Ctrl</kbd>+<kbd>A</kbd> produces a range with a `null` start and end column. Use `GridRange.boundedRanges` before iterating over cells, since `GridRange.forEachCell` throws on unbounded ranges.
- Routing `setValueForCell` and `setValueForRanges` through `setValues` keeps all the save logic in one place.

## How users edit

| Action                                                   | Result                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Double-click, <kbd>Enter</kbd>, or <kbd>F2</kbd>         | Opens the editor with the value from `editValueForCell`.                                                                      |
| Type a character                                         | Opens the editor, replacing the value with the typed character. The arrow keys commit the edit and move to the adjacent cell. |
| <kbd>Backspace</kbd>                                     | Opens the editor with an empty value.                                                                                         |
| <kbd>Delete</kbd>                                        | Clears the active cell by calling `setValueForCell` with an empty string.                                                     |
| <kbd>Enter</kbd> / <kbd>Shift</kbd>+<kbd>Enter</kbd>     | While editing, commits the edit and moves down or up.                                                                         |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd>         | While editing, commits the edit and moves right or left.                                                                      |
| <kbd>Ctrl</kbd>+<kbd>Enter</kbd> (<kbd>⌘</kbd> on macOS) | While editing, commits the value to every selected cell by calling `setValueForRanges`.                                       |
| <kbd>Alt</kbd>+<kbd>Enter</kbd>                          | While editing, inserts a new line.                                                                                            |
| <kbd>Escape</kbd>                                        | While editing, cancels the edit.                                                                                              |
| Click outside the editor                                 | Commits the edit.                                                                                                             |
| <kbd>Ctrl</kbd>+<kbd>V</kbd> (<kbd>⌘</kbd> on macOS)     | Pastes by calling `setValues`. A single value fills every selected cell; tab-separated rows paste as a block.                 |

## Validation and read-only columns

In this example, the Name column is read-only, Goals and Salary only accept whole numbers, and Team can't be empty. Salary displays as currency, but `editValueForCell` returns the raw number so users don't have to type the currency formatting. Type an invalid value to see the editor outlined in red. Paste invalid text, or paste into the Name column, to see an error.

Grid only checks `isValidForCell` for the active cell. Pasted values and the other cells in a <kbd>Ctrl</kbd>+<kbd>Enter</kbd> fill aren't checked, so `setValues` validates every edit and throws if any are invalid.

```tsx live noInline
const NAME = 0;
const TEAM = 1;
const GOALS = 2;
const SALARY = 3;

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

class PlayerModel extends GridModel implements EditableGridModel {
  private data: (string | number)[][];

  constructor(data: (string | number)[][]) {
    super();
    this.data = data;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return 4;
  }

  textForColumnHeader(column: ModelIndex): string {
    return ['Name', 'Team', 'Goals', 'Salary'][column];
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    const value = this.data[row][column];
    return column === SALARY ? currency.format(value as number) : `${value}`;
  }

  get isEditable(): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    // Name is the first column, so only ranges that start after it are editable.
    // A null startColumn means the range spans every column.
    return range.startColumn != null && range.startColumn > NAME;
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    switch (column) {
      case TEAM:
        return value.trim().length > 0;
      case GOALS:
      case SALARY:
        return /^\d+$/.test(value);
      default:
        return false;
    }
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return `${this.data[row][column]}`;
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    await this.setValues([{ column, row, text: value }]);
  }

  async setValueForRanges(
    ranges: readonly GridRange[],
    value: string
  ): Promise<void> {
    const edits: EditOperation[] = [];
    GridRange.forEachCell(
      GridRange.boundedRanges(ranges, this.columnCount, this.rowCount),
      (column, row) => edits.push({ column, row, text: value })
    );
    await this.setValues(edits);
  }

  async setValues(edits: readonly EditOperation[]): Promise<void> {
    const invalid = edits.find(
      ({ column, row, text }) =>
        !this.isEditableRange(GridRange.makeCell(column, row)) ||
        !this.isValidForCell(column, row, text)
    );
    if (invalid != null) {
      const header = this.textForColumnHeader(invalid.column);
      throw new Error(`Invalid value "${invalid.text}" for ${header}`);
    }

    edits.forEach(({ column, row, text }) => {
      this.data[row][column] = column === TEAM ? text : Number(text);
    });
  }
}

function ValidationExample(): JSX.Element {
  const model = useMemo(
    () =>
      new PlayerModel([
        ['Matthew Austins', 'Toronto', 35, 1200000],
        ['Doug Millgore', 'Toronto', 14, 850000],
        ['Bart Marchant', 'Boston', 20, 975000],
        ['Luigi Dabest', 'Pittsburgh', 66, 2500000],
      ]),
    []
  );

  return <Grid model={model} onError={error => alert(error.message)} />;
}

render(<ValidationExample />);
```

## Saving to a server

Edits usually need to be saved somewhere else. Since the `set` methods are asynchronous, they can wait for a server response. This example shows edits immediately in gray while a simulated save is in progress, then rolls back to the last saved value if the save fails. Enter a value containing "fail" to see the rollback.

```tsx live noInline
function saveToServer(edits: readonly EditOperation[]): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (edits.some(({ text }) => text.toLowerCase().includes('fail'))) {
        reject(new Error('Server rejected the edit'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

class ServerModel extends GridModel implements EditableGridModel {
  private data: string[][];

  private savedData: string[][];

  private columnHeaders: string[];

  private onChange: () => void;

  private pending = new Set<string>();

  constructor(data: string[][], columnHeaders: string[], onChange: () => void) {
    super();
    this.data = data;
    this.savedData = data.map(row => [...row]);
    this.columnHeaders = columnHeaders;
    this.onChange = onChange;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.columnHeaders.length;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return this.data[row][column];
  }

  textForColumnHeader(column: ModelIndex): string {
    return this.columnHeaders[column];
  }

  colorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridThemeType
  ): string {
    return this.pending.has(`${column},${row}`) ? '#888888' : theme.textColor;
  }

  get isEditable(): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    return true;
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    return true;
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textForCell(column, row);
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    await this.setValues([{ column, row, text: value }]);
  }

  async setValueForRanges(
    ranges: readonly GridRange[],
    value: string
  ): Promise<void> {
    const edits: EditOperation[] = [];
    GridRange.forEachCell(
      GridRange.boundedRanges(ranges, this.columnCount, this.rowCount),
      (column, row) => edits.push({ column, row, text: value })
    );
    await this.setValues(edits);
  }

  async setValues(edits: readonly EditOperation[]): Promise<void> {
    if (edits.some(({ column, row }) => this.pending.has(`${column},${row}`))) {
      throw new Error('A selected cell is still saving. Wait and try again.');
    }
    edits.forEach(({ column, row, text }) => {
      this.data[row][column] = text;
      this.pending.add(`${column},${row}`);
    });
    this.onChange();

    try {
      await saveToServer(edits);
      edits.forEach(({ column, row, text }) => {
        this.savedData[row][column] = text;
      });
    } catch (e) {
      edits.forEach(({ column, row }) => {
        this.data[row][column] = this.savedData[row][column];
      });
      throw e;
    } finally {
      edits.forEach(({ column, row }) => {
        this.pending.delete(`${column},${row}`);
      });
      this.onChange();
    }
  }
}

function ServerExample(): JSX.Element {
  const grid = useRef<Grid>(null);
  const model = useMemo(
    () =>
      new ServerModel(
        [
          ['Matthew Austins', 'Toronto'],
          ['Doug Millgore', 'Toronto'],
          ['Bart Marchant', 'Boston'],
          ['Luigi Dabest', 'Pittsburgh'],
        ],
        ['Name', 'Team'],
        () => grid.current?.forceUpdate()
      ),
    []
  );

  return (
    <Grid model={model} ref={grid} onError={error => alert(error.message)} />
  );
}

render(<ServerExample />);
```

## Custom cell editors

By default, Grid edits cells in a text area. To use a different editor for a column, return a restriction from the model's `getColumnRestrictions` method, and pass Grid a `cellInputRendererRegistry` that maps the restriction's `type` to a render function. Grid passes the render function [CellInputProps](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridRendererTypes.ts), including:

- `value`: the starting value from `editValueForCell`.
- `restrictions`: the restrictions returned by `getColumnRestrictions`.
- `onDone(value, { direction })`: commits the value. `direction` is the direction to move the cursor afterwards. It defaults to down; pass `null` to stay on the cell.
- `onCancel()`: cancels the edit.
- `style`: styling to match the cell being edited.

Set `preservesExistingValue` to `true` on the render function so typing a character opens the editor with the existing value instead of replacing it.

This example edits the Team column with a dropdown. Use the arrow keys to pick a team, then press <kbd>Enter</kbd> to commit or <kbd>Escape</kbd> to cancel.

```tsx live noInline
const TEAMS = ['Boston', 'Pittsburgh', 'Toronto'];
const TEAM = 1;

type OptionsRestriction = ColumnRestriction & { options: string[] };

class TeamModel extends GridModel implements EditableGridModel {
  private data: string[][];

  constructor(data: string[][]) {
    super();
    this.data = data;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return 2;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return this.data[row][column];
  }

  textForColumnHeader(column: ModelIndex): string {
    return ['Name', 'Team'][column];
  }

  getColumnRestrictions(column: ModelIndex): OptionsRestriction[] {
    return column === TEAM ? [{ type: 'options', options: TEAMS }] : [];
  }

  get isEditable(): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    return true;
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    return column !== TEAM || TEAMS.includes(value);
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textForCell(column, row);
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    await this.setValues([{ column, row, text: value }]);
  }

  async setValueForRanges(
    ranges: readonly GridRange[],
    value: string
  ): Promise<void> {
    const edits: EditOperation[] = [];
    GridRange.forEachCell(
      GridRange.boundedRanges(ranges, this.columnCount, this.rowCount),
      (column, row) => edits.push({ column, row, text: value })
    );
    await this.setValues(edits);
  }

  async setValues(edits: readonly EditOperation[]): Promise<void> {
    const invalid = edits.find(
      ({ column, row, text }) => !this.isValidForCell(column, row, text)
    );
    if (invalid != null) {
      throw new Error(`Team must be one of ${TEAMS.join(', ')}`);
    }

    edits.forEach(({ column, row, text }) => {
      this.data[row][column] = text;
    });
  }
}

function SelectInput({
  value = '',
  restrictions,
  onDone,
  onCancel,
  style,
}: CellInputProps): JSX.Element {
  const [selected, setSelected] = useState(value);
  const isDone = useRef(false);
  const { options } = restrictions[0] as OptionsRestriction;

  const finish = (callback: () => void): void => {
    // Committing focuses the grid, which blurs the select and would commit again
    if (isDone.current) return;
    isDone.current = true;
    callback();
  };

  return (
    <select
      autoFocus
      value={selected}
      style={{ ...style, width: '100%', height: '100%' }}
      onChange={event => setSelected(event.target.value)}
      onBlur={() => finish(() => onDone?.(selected, { direction: null }))}
      onKeyDown={event => {
        // Stop the grid from handling keys while the editor is open
        event.stopPropagation();
        if (event.key === 'Enter') {
          finish(() => onDone?.(selected, {}));
        } else if (event.key === 'Escape') {
          finish(() => onCancel?.());
        }
      }}
    >
      {options.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const renderSelectInput: CellInputRendererFn = props => (
  <SelectInput {...props} />
);
renderSelectInput.preservesExistingValue = true;

const cellInputRendererRegistry: CellInputRendererRegistry = new Map([
  ['options', renderSelectInput],
]);

function CustomEditorExample(): JSX.Element {
  const model = useMemo(
    () =>
      new TeamModel([
        ['Matthew Austins', 'Toronto'],
        ['Doug Millgore', 'Toronto'],
        ['Bart Marchant', 'Boston'],
        ['Luigi Dabest', 'Pittsburgh'],
      ]),
    []
  );

  return (
    <Grid
      model={model}
      cellInputRendererRegistry={cellInputRendererRegistry}
      onError={error => alert(error.message)}
    />
  );
}

render(<CustomEditorExample />);
```

## API reference

```{autodoc} EditableGridModel

```
