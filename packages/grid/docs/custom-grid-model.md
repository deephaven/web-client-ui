### Creating my own grid model

```tsx
import GridModel from './GridModel';

/**
 * A simple model that displays credit card data
 */

class CreditCardDataGridModel extends GridModel {
  private data: unknown[][];

  private columnHeaders?: string[];

  private numberOfColumns: number;

  constructor(data: unknown[][], columnHeaders?: string[]) {
    super();

    this.data = data;
    this.numberOfColumns = Math.max(
      ...data.map(row => row.length),
      columnHeaders?.length ?? 0
    );
    this.columnHeaders = columnHeaders;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.numberOfColumns;
  }

  textForCell(column: number, row: number): string {
    return `${this.data[row]?.[column]}`;
  }

  textForColumnHeader(column: number): string {
    return this.columnHeaders?.[column] ?? '';
  }
}

export default CreditCardDataGridModel;
```

```tsx
import { MockGridModel } from '@deephaven/grid';

// Generate fake data for a marketing grid model

const COLUMNS = [
  'Index',
  'Timestamp',
  'Symbol',
  'Exchange',
  'Sector', // Added Sector column
  'Price',
  'Bid',
  'Ask',
  'Side',
  'Change',
  'Change %',
  'Volume',
];

const SIDE = ['Buy', 'Sell'];

const EXCHANGES = ['NYSE', 'NASDAQ', 'MEMX', 'LSE', 'TSX'];

const SYMBOLS = [
  'AAPL',
  'GOOGL',
  'AMZN',
  'MSFT',
  'TSLA',
  'FB',
  'NFLX',
  'NVDA',
  'BRK.A',
  'V',
];

// Map symbols to sectors
const SYMBOL_TO_SECTOR = {
  AAPL: 'Technology',
  GOOGL: 'Technology',
  AMZN: 'Consumer Discretionary',
  MSFT: 'Technology',
  TSLA: 'Consumer Discretionary',
  FB: 'Technology',
  NFLX: 'Communication Services',
  NVDA: 'Technology',
  'BRK.A': 'Financials',
  V: 'Financials',
};

const ABS_CHANGE_PCT = 5;

// Simple seeded random number generator (mulberry32)
function seededRandom(seed) {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Vibe coded until it looked good
// designed to be stable random data until model is re-created with a new seed
// this allows the grid to be stable while scrolling, but change when the seed changes
function makeGenerators(offset) {
  const now = Date.now();

  // Helper to generate price for a row
  const priceForRow = row => seededRandom(row - offset)() * 1000;

  const changeForRow = row => {
    // Pick randomly between bid and ask price and use the difference from price as the change
    const price = priceForRow(row);
    // generate a random change between -5% and +5% of the price
    const changePct = seededRandom(row - offset)() * 0.1 - ABS_CHANGE_PCT / 100;
    const value = price * changePct;
    return value;
  };

  const symbolForRow = row =>
    SYMBOLS[Math.floor(seededRandom(row - offset)() * SYMBOLS.length)];

  return {
    Index: row => String(row + 1),
    Timestamp: row => {
      if (row < 1000) {
        return new Date(now - row * 0.0001).toISOString();
      } else {
        // Make rows after 1000 stable
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(today.getTime() - row * 0.0001);
        return date.toISOString();
      }
    },
    Symbol: row => String(symbolForRow(row)),
    Exchange: row =>
      EXCHANGES[Math.floor(seededRandom(row - offset)() * EXCHANGES.length)],
    Sector: row => {
      // Use the same logic as Symbol to get the symbol for this row
      const symbol = symbolForRow(row);
      return SYMBOL_TO_SECTOR[symbol] || 'Unknown';
    },
    Price: row => priceForRow(row).toFixed(2),
    Bid: row =>
      (
        priceForRow(row) -
        0.01 * (seededRandom(row - offset)() + row * 0.07) * 10
      ).toFixed(2),
    Ask: row =>
      (
        priceForRow(row) +
        0.01 * (seededRandom(row - offset)() + row * 0.09) * 10
      ).toFixed(2),
    Side: row => {
      const sideIdx = Math.floor(seededRandom(row - offset)() * SIDE.length);
      return SIDE[sideIdx];
    },
    Change: row => {
      return String(changeForRow(row).toFixed(2));
    },
    // Change % is a percentage of the price change
    'Change %': row => {
      const price = priceForRow(row);
      const change = changeForRow(row);
      if (price === 0) return '0.00%'; // Avoid division by zero
      const changePct = ((change / price) * 100).toFixed(2);
      return `${changePct}%`;
    },
    Volume: row => {
      // Exponential weighting: higher values are more likely
      const rand = seededRandom(row - offset)();
      // Exponential distribution: scale for max volume
      const maxVolume = 1000000;
      const lambda = 0.00005; // smaller lambda = heavier tail
      const expVolume = Math.floor(-Math.log(1 - rand) / lambda);
      if (rand < 0.6) {
        // round to nearest 1000 and cap at maxVolume
        return String(
          Math.min(
            Math.round(expVolume / 100) * 100,
            maxVolume
          ).toLocaleString()
        );
      }
      const volume = Math.min(expVolume, maxVolume);
      return String(volume.toLocaleString());
    },
  };
}

export class GridMarketingModel extends MockGridModel {
  constructor(offset = 0) {
    super({ rowCount: Number.MAX_SAFE_INTEGER, columnCount: COLUMNS.length });
    this.offset = offset;
    this.generators = makeGenerators(offset);
    this.changePctCol = COLUMNS.indexOf('Change %');
  }

  textForColumnHeader(column) {
    if (column < 0 || column >= COLUMNS.length) {
      return '';
    }
    return COLUMNS[column];
  }

  textForRowHeader(row) {
    return '';
  }

  textForRowFooter(row) {
    return '';
  }

  textAlignForCell(column, row) {
    const columnName = COLUMNS[column];
    // price, bid, ask, change, and volume are right-aligned
    if (
      columnName === 'Index' ||
      columnName === 'Price' ||
      columnName === 'Bid' ||
      columnName === 'Ask' ||
      columnName === 'Change' ||
      columnName === 'Change %' ||
      columnName === 'Volume'
    ) {
      return 'right';
    }
  }
  textForCell(column, row) {
    if (column < 0 || column >= COLUMNS.length || row < 0) {
      return '';
    }
    const columnName = COLUMNS[column];
    const generator = this.generators[columnName];
    if (generator) {
      return generator(row);
    }
    return '';
  }

  colorForCell(column, row, theme) {
    const value = this.textForCell(column, row);
    const columnName = COLUMNS[column];
    if (value != null) {
      if (columnName === 'Timestamp') {
        return theme.dateColor;
      }
      if (
        columnName === 'Price' ||
        columnName === 'Bid' ||
        columnName === 'Ask'
      ) {
        const parsedVal = parseFloat(value);
        if (Number.isNaN(parsedVal) || parsedVal === 0) {
          return theme.zeroNumberColor;
        }
        return parsedVal < 0
          ? theme.negativeNumberColor
          : theme.positiveNumberColor;
      }

      if (columnName === 'Change' || columnName === 'Change %') {
        const parsedVal = parseFloat(value);
        if (Number.isNaN(parsedVal) || parsedVal === 0) {
          return theme.zeroNumberColor;
        }
        return parsedVal < 0
          ? theme.negativeNumberColor
          : theme.positiveNumberColor;
      }
    }

    return theme.textColor;
  }

  // Add renderTypeForCell to specify databar for Change % column
  renderTypeForCell(column, row) {
    if (column === this.changePctCol) {
      return 'dataBar';
    }
    return 'text';
  }

  // Add dataBarOptionsForCell for Change % column
  dataBarOptionsForCell(column, row, theme) {
    if (column !== this.changePctCol) return undefined;
    const valueStr = this.textForCell(column, row);
    // Remove % and parse float
    const value = parseFloat(valueStr.replace('%', ''));
    return {
      columnMin: ABS_CHANGE_PCT * -1,
      columnMax: ABS_CHANGE_PCT,
      axis: 'proportional',
      color: value >= 0 ? theme.positiveBarColor : theme.negativeBarColor,
      valuePlacement: 'overlap',
      opacity: 0.2,
      markers: [],
      direction: 'LTR',
      value,
    };
  }

  get isEditable() {
    return false;
  }
}

export default GridMarketingModel;
```
