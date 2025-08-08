# Creating my own grid model

For more control over how your data will be displayed, you can create your own data grid model. Here is an example that fetches Robert De Niro's movie data from a CSV file and renders it using a custom data grid model:

See [GridModel](https://github.com/deephaven/web-client-ui/blob/main/packages/grid/src/GridModel.ts) for full list of properties and methods.

```jsx live noInline
class DeNiroDataGridModel extends GridModel {
  private data: unknown[][];

  private columnHeaders: string[];

  private numberOfColumns: number;

  constructor() {
    super();

    this.columnHeaders = [];
    this.data = [[]];
    this.numberOfColumns = 0;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.numberOfColumns;
  }

  updateData(data: unknown[][]): void {
    this.columnHeaders = data[0]
    this.data = data.splice(1)
    this.numberOfColumns = data[0].length
  }

  textForCell(column: number, row: number): string {
    return `${this.data[row]?.[column]}`;
  }

  textForColumnHeader(column: number): string {
    return this.columnHeaders?.[column] ?? '';
  }

  renderTypeForCell(column: ModelIndex, row: ModelIndex): CellRenderType {
    if (this.columnHeaders[column] === 'Score') {
      return 'dataBar';
    }
    return 'text';
  }

  dataBarOptionsForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridTheme
  ): DataBarOptions | undefined {
    if (this.columnHeaders[column] === 'Score') {
      const value = parseFloat(this.textForCell(column, row));
      if (Number.isNaN(value)) {
        return undefined;
      }
      const min = Math.min(
        ...this.data.map(rowData => parseFloat(rowData[column] as string))
      );
      const max = Math.max(
        ...this.data.map(rowData => parseFloat(rowData[column] as string))
      );
      return {
        columnMin: min,
        columnMax: max,
        axis: 'proportional',
        color: value >= 50 ? theme.positiveBarColor : theme.negativeBarColor,
        valuePlacement: 'overlap',
        opacity: 0.2,
        markers: [],
        direction: 'LTR',
        value,
      } as DataBarOptions;
    }
    return undefined;
  }
}

function parseCSV(csvText) {
  const rows = csvText.split('\n').filter(row => row.trim());
  const result = [];

  for (const row of rows) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    cells.push(current.trim());
    result.push(cells);
  }

  return result;
}

function CustomGridExample() {
  const [model] = useState(() => new DeNiroDataGridModel())
  const grid = useRef();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeNiroMovies = async () => {
      try {
        const response = await fetch(
          'https://media.githubusercontent.com/media/deephaven/examples/main/DeNiro/csv/deniro.csv'
        );

        if (!response.ok) {
          throw new Error('Failed to fetch credit card data');
        }

        const data = await response.text();
        const parsedData = parseCSV(data)
        model.updateData(parsedData)
        // grid.current.forceUpdate()
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDeNiroMovies();
  }, []);

  return <Grid model={model} ref={grid} />;
}

render(<CustomGridExample />)
```
