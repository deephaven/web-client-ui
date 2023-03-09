// A mocked Deephaven API! For help with development and unit tests.
const NETWORK_DELAY = 100;
const FILTER_DELAY = NETWORK_DELAY * 10;
const SORT_DELAY = NETWORK_DELAY * 5;
const CUSTOM_COLUMNS_DELAY = NETWORK_DELAY * 5;
const UPDATE_INTERVAL = NETWORK_DELAY * 10;
// can be changed to other number to mock loading delay
const AUTH_CONFIG_LOADING_DELAY = 0;
const QUERY_COUNT = 10;
const COLUMN_COUNT = 20;
const ROW_COUNT = 1000000000;

// https://www.stockmarketclock.com/exchanges
const START_DATE = 1483228800000; // Jan 1, 2017
const EXCHANGES = [
  'NYSE',
  'NASDAQ',
  'JPX',
  'SSE',
  'LSE',
  'HKEX',
  'SZSE',
  'TSX',
  'FSX',
  'BSE',
  'NSE',
  'SIX',
  'KRX',
  'ASX',
  'OMX',
  'JSE',
  'TWSE',
  'BME',
  'SGX',
  'MOEX',
  'SET',
  'IDX',
  'MYX',
  'BMV',
  'PSE',
  'OSE',
  'BVS',
  'TASE',
  'BIST',
  'QE',
  'GPW',
  'ISE',
  'ADX',
  'BVC',
  'VSE',
  'TSE',
  'DFM',
  'BVL',
  'NZX',
  'BCBA',
  'HOSE',
  'BC',
  'LuxSE',
  'KASE',
  'DSE',
  'CSE',
  'ASE',
  'EGX',
  'NSE',
  'ASE',
  'BSE',
  'ZSE',
  'BHB',
  'BVB',
  'CSE',
  'NSE',
  'BSE',
  'SEM',
  'JSE',
  'HNX',
  'MSE',
  'UX',
  'PEX',
  'BDE',
  'BSX',
  'EUREX',
  'PSX',
  'OMXH',
  'OMXR',
  'Euronext',
  'BX',
  'MTA',
  'OMXC',
];
const STOCKS = [
  'AAPL',
  'INTC',
  'GOOG',
  'PFE',
  'NOK',
  'UNH',
  'AMZN',
  'XOM',
  'WMT',
  'TGT',
  'LUV',
  'VZ',
  'NVDA',
  'MCK',
  'HPQ',
  'MDT',
  'TXN',
  'ABT',
  'BMY',
  'DNR',
  'MSFT',
  'BRK.A',
  'ORCL',
  'NFLX',
  'XRX',
  'DIS',
  'MRK',
  'ROST',
  'CVX',
  'TWX',
  'MMM',
  'CSCO',
  'AXP',
  'MRO',
  'ANF',
  'SBUX',
  'BPOP',
  'MDR',
  'AMGN',
  'RTN',
  'AKS',
  'AZO',
  'SYMC',
  'AGN',
  'WMB',
  'JNPR',
  'RIG',
];

const COLUMN_TYPE_INT = 'int';
const COLUMN_TYPE_INT_OBJECT = 'java.lang.Integer';
const COLUMN_TYPE_LONG = 'long';
const COLUMN_TYPE_LONG_OBJECT = 'java.lang.Long';
const COLUMN_TYPE_SHORT = 'short';
const COLUMN_TYPE_SHORT_OBJECT = 'java.lang.Short';
const COLUMN_TYPE_BYTE = 'byte';
const COLUMN_TYPE_BYTE_OBJECT = 'java.lang.Byte';
const COLUMN_TYPE_DOUBLE = 'double';
const COLUMN_TYPE_DOUBLE_OBJECT = 'java.lang.Double';
const COLUMN_TYPE_BIG_DECIMAL = 'java.math.BigDecimal';
const COLUMN_TYPE_BIG_INTEGER = 'java.math.BigInteger';
const COLUMN_TYPE_FLOAT = 'float';
const COLUMN_TYPE_FLOAT_OBJECT = 'java.lang.Float';
const COLUMN_TYPE_BOOLEAN = 'boolean';
const COLUMN_TYPE_BOOLEAN_OBJECT = 'java.lang.Boolean';
const COLUMN_TYPE_CHAR = 'char';
const COLUMN_TYPE_CHAR_OBJECT = 'java.lang.Character';
const COLUMN_TYPE_STRING = 'java.lang.String';
const COLUMN_TYPE_STRING_ARRAY = 'java.lang.String[]';
const COLUMN_TYPE_DATE = 'io.deephaven.time.DateTime';

// io.deephaven.web.client.api.input.ColumnValueDehydrater#serialize
const COLUMN_TYPES = [
  COLUMN_TYPE_INT,
  COLUMN_TYPE_INT_OBJECT,
  COLUMN_TYPE_LONG,
  COLUMN_TYPE_LONG_OBJECT,
  COLUMN_TYPE_SHORT,
  COLUMN_TYPE_SHORT_OBJECT,
  COLUMN_TYPE_BYTE,
  COLUMN_TYPE_BYTE_OBJECT,
  COLUMN_TYPE_DOUBLE,
  COLUMN_TYPE_DOUBLE_OBJECT,
  COLUMN_TYPE_BIG_DECIMAL,
  COLUMN_TYPE_BIG_INTEGER,
  COLUMN_TYPE_FLOAT,
  COLUMN_TYPE_FLOAT_OBJECT,
  COLUMN_TYPE_BOOLEAN,
  COLUMN_TYPE_BOOLEAN_OBJECT,
  COLUMN_TYPE_CHAR,
  COLUMN_TYPE_CHAR_OBJECT,
  COLUMN_TYPE_STRING,
  COLUMN_TYPE_DATE,
];

function makeId() {
  return `id${Date.now()}`;
}

function makeKnownConfigs() {
  return [
    new QueryInfo({
      name: `WebClientData`,
      serial: `1`,
      tables: ['workspaceData'],
      mockTables: {
        workspaceData: makeWorkspaceDataTable(),
      },
    }),
    new QueryInfo({
      name: `Mock Query`,
      serial: `12345`,
      tables: ['MOCK Table A', 'MOCK Table B', 'MOCK Table C'],
      figures: ['MOCK Figure A', 'MOCK Figure B', 'MOCK Figure C'],
    }),
  ];
}

function priceForCell(x, y) {
  return Math.sin((x + 1) * (y + 1)) * 10;
}

function valueForCell(x, y, name = '', type = '') {
  switch (name) {
    case 'Exchange':
      return EXCHANGES[Math.floor(y / STOCKS.length) % EXCHANGES.length];
    case 'Stock':
      return STOCKS[y % STOCKS.length];
    case 'Id':
      return makeId();
    case 'Data':
      return JSON.stringify({});
    case 'Version':
      return 10;
    default:
      break;
  }

  switch (type) {
    case COLUMN_TYPE_STRING:
      return STOCKS[y % STOCKS.length];
    case COLUMN_TYPE_BOOLEAN:
    case COLUMN_TYPE_BOOLEAN_OBJECT:
      return (x + y) % 2 ? true : false;
    case COLUMN_TYPE_INT:
    case COLUMN_TYPE_INT_OBJECT:
    case COLUMN_TYPE_SHORT:
    case COLUMN_TYPE_SHORT_OBJECT:
    case COLUMN_TYPE_BIG_INTEGER:
    case COLUMN_TYPE_BYTE:
    case COLUMN_TYPE_BYTE_OBJECT:
    case COLUMN_TYPE_LONG:
    case COLUMN_TYPE_LONG_OBJECT:
      return y;
    case COLUMN_TYPE_DOUBLE:
    case COLUMN_TYPE_DOUBLE_OBJECT:
    case COLUMN_TYPE_BIG_DECIMAL:
    case COLUMN_TYPE_FLOAT:
    case COLUMN_TYPE_FLOAT_OBJECT:
      return priceForCell(x, y);
    case COLUMN_TYPE_CHAR:
    case COLUMN_TYPE_CHAR_OBJECT:
      return String.fromCharCode(65 + (y % 58));
    case COLUMN_TYPE_DATE:
      return new Date(y * 10 + START_DATE);
    case 'test':
      return `${name}${y}`;
    default:
      return 'Unknown Type';
  }
}

function makeColumn(index, name, type) {
  return new Column({ index, name, type });
}

function makeDummyTable(columnCount = COLUMN_COUNT) {
  var columns = [];
  columns.push(makeColumn(0, 'Timestamp', COLUMN_TYPE_DATE));
  columns.push(makeColumn(1, 'Exchange', COLUMN_TYPE_STRING));
  columns.push(makeColumn(2, 'Stock', COLUMN_TYPE_STRING));
  for (let i = 0; i < columnCount; i += 1) {
    const type = COLUMN_TYPES[i % COLUMN_TYPES.length];
    const suffixValue = Math.floor(i / COLUMN_TYPES.length);
    const suffix = suffixValue > 0 ? `_${suffixValue}` : '';
    const name = `${type}${suffix}`;
    const column = makeColumn(i + 3, name, type);
    columns.push(column);
  }

  return new Table({ columns });
}

function makeWorkspaceDataTable() {
  return new Table({
    columns: [
      makeColumn(0, 'Id', COLUMN_TYPE_STRING),
      makeColumn(1, 'Date', COLUMN_TYPE_STRING),
      makeColumn(2, 'Owner', COLUMN_TYPE_STRING),
      makeColumn(3, 'Name', COLUMN_TYPE_STRING),
      makeColumn(4, 'Version', COLUMN_TYPE_INT),
      makeColumn(5, 'DataType', COLUMN_TYPE_STRING),
      makeColumn(6, 'Data', COLUMN_TYPE_STRING),
      makeColumn(7, 'Status', COLUMN_TYPE_STRING),
      makeColumn(8, 'AdminGroups', COLUMN_TYPE_STRING_ARRAY),
      makeColumn(9, 'ViewerGroups', COLUMN_TYPE_STRING_ARRAY),
      makeColumn(10, 'LastModifiedByAuthenticated', COLUMN_TYPE_STRING),
      makeColumn(11, 'LastModifiedByEffective', COLUMN_TYPE_STRING),
      makeColumn(12, 'LastModifiedTime', COLUMN_TYPE_DATE),
    ],
    suppressFilter: true,
  });
}

function makeDummyTotalsTable(config = {}) {
  if (!config.operationMap) {
    config.operationMap = { MOCK: [TotalsTableConfig.COUNT] };
  }
  const operationMap = config.operationMap;
  const keys = Object.keys(operationMap);
  const columnName = keys[0];
  const operations = operationMap[columnName];

  let columns = [];
  for (let i = 0; i < operations.length; i += 1) {
    const operation = operations[i];
    const column = new Column({
      index: i,
      name: `${columnName}__${operation}`,
      type: 'double',
    });
    columns.push(column);
  }

  return new TotalsTable({ columns, config });
}

function makeDummyAxis(
  label = 'Axis',
  type = AxisType.X,
  formatType = AxisFormatType.NUMBER,
  formatPattern = '###,##0.00###'
) {
  return new Axis({ label, type, formatPattern });
}

function makeDummyAxes() {
  return [
    makeDummyAxis('x-axis', AxisType.X),
    makeDummyAxis('y-axis', AxisType.Y),
  ];
}

function makeSeriesSource(axis) {
  return new SeriesDataSource({ axis, type: axis.type });
}

function makeDummySeriesSources() {
  const axes = makeDummyAxes();
  return axes.map(makeSeriesSource);
}

function makeDummySeries(
  name = '',
  plotStyle = SeriesPlotStyle.SCATTER,
  sources = [],
  color = null
) {
  return new Series(name, plotStyle, sources, color);
}

function makeDummyChart(
  title = 'Chart',
  series = [
    makeDummySeries(
      'Series',
      SeriesPlotStyle.SCATTER,
      makeDummySeriesSources()
    ),
  ],
  axes = makeDummyAxes()
) {
  return new Chart({ title, series, axes });
}

function makeDummyFigure(
  title = 'Figure',
  charts = [makeDummyChart(`${title}-Chart`)]
) {
  return new Figure({ title, charts });
}

// Base class with listener implementation
class DeephavenObject {
  constructor(props = {}) {
    this._listeners = {};
  }

  addEventListener(event, callback) {
    if (this._listeners[event]) {
      this._listeners[event].push(callback);
    } else {
      this._listeners[event] = [callback];
    }

    return () => this.removeEventListener(event, callback);
  }

  removeEventListener(event, callback) {
    let callbacks = this._listeners[event];
    if (!callbacks || 0 === callbacks.length) {
      return;
    }

    for (let i = callbacks.length - 1; 0 <= i; --i) {
      if (callbacks[i] === callback) {
        callbacks.splice(i, 1);
      }
    }

    if (0 < callbacks.length) {
      this._listeners[event] = callbacks;
    } else {
      delete this._listeners[event];
    }
  }

  fireEvent(name, detail) {
    const callbacks = this._listeners[name];
    if (!callbacks || 0 === callbacks.length) {
      return;
    }

    const event = new CustomEvent(name, { detail: detail });
    for (let i = 0; i < callbacks.length; i++) {
      callbacks[i](event);
    }
  }
}

class Sort {
  constructor({ column = null, direction = 'ASC', isAbs = false } = {}) {
    this.column = column;
    this.direction = direction;
    this.isAbs = isAbs;
  }
  asc() {
    return new Sort({
      column: this.column,
      direction: 'ASC',
      isAbs: this.isAbs,
    });
  }
  desc() {
    return new Sort({
      column: this.column,
      direction: 'DESC',
      isAbs: this.isAbs,
    });
  }
  abs() {
    return new Sort({
      column: this.column,
      direction: this.direction,
      isAbs: true,
    });
  }
}

class Format {
  constructor(props) {
    this.color = props.color || null;
    this.backgroundColor = props.backgroundColor || null;
    this.numberFormat = props.numberFormat || null;
  }
}

class FilterCondition {
  constructor(type, parent) {
    this.type = type;
    this.parent = parent;
  }

  not() {
    return new FilterCondition('not', this);
  }
  and(...condition) {
    return new FilterCondition('and', this);
  }
  or(...condition) {
    return new FilterCondition('or', this);
  }
  toString() {
    return 'MockFilterCondition' + this.type;
  }
}

class FilterValue {
  static ofString(value) {
    return new FilterValue();
  }
  static ofNumber(value) {
    return new FilterValue();
  }
  static ofDateTime(value) {
    return new FilterValue();
  }
  static ofBoolean(value) {
    return new FilterValue();
  }

  eq(value) {
    return new FilterCondition();
  }
  eqIgnoreCase(value) {
    return new FilterCondition();
  }
  notEq(value) {
    return new FilterCondition();
  }
  notEqIgnoreCase(value) {
    return new FilterCondition();
  }
  greaterThan(value) {
    return new FilterCondition();
  }
  lessThan(value) {
    return new FilterCondition();
  }
  greaterThanOrEqualTo(value) {
    return new FilterCondition();
  }
  lessThanOrEqualTo(value) {
    return new FilterCondition();
  }
  in(value) {
    return new FilterCondition();
  }
  inIgnoreCase(value) {
    return new FilterCondition();
  }
  notIn(value) {
    return new FilterCondition();
  }
  notInIgnoreCase(value) {
    return new FilterCondition();
  }
  isTrue(value) {
    return new FilterCondition();
  }
  isFalse(value) {
    return new FilterCondition();
  }
  isNull(value) {
    return new FilterCondition();
  }
  invoke(value, ...args) {
    return new FilterCondition();
  }
}

class Column {
  constructor({ index = 0, type = 'java.lang.String', name = '' } = {}) {
    this.index = index;
    this.type = type;
    this.name = name;
  }

  get(row) {
    return valueForCell(this.index, row.index, this.name, this.type);
  }

  sort() {
    return new Sort({ column: this });
  }

  filter() {
    return new FilterValue();
  }
}

class Row {
  constructor({ index = 0, name = '' } = {}) {
    this.index = index;
    this.name = name;
  }

  get(column) {
    return valueForCell(column.index, this.index, column.name, column.type);
  }

  getFormat(column) {
    // const backgroundColor = this.index % 2 ? '#2d2a2e' : '#373438';
    const backgroundColor = null;

    if (column.index <= 2) {
      // String, use string formatting/yellow text
      return new Format({ color: '#ffd546', backgroundColor: backgroundColor });
    } else {
      // It's a price, use number formatting
      const price = priceForCell(column.index, this.index);
      if (0 < price) {
        return new Format({
          color: '#9fde70',
          backgroundColor: backgroundColor,
        });
      } else {
        return new Format({
          color: '#fefffd',
          backgroundColor: backgroundColor,
        });
      }
    }
  }
}

class ViewportData {
  constructor(props = {}) {
    this.offset = props.offset || 0;
    this.rows = props.rows || [];
    this.columns = props.columns || [];
  }
}

class Table extends DeephavenObject {
  constructor({
    sort = [],
    filter = [],
    columns = [],
    size = ROW_COUNT,
    suppressFilter = false,
    customColumns = [],
  } = {}) {
    super({ sort, filter, columns, size });

    this.sort = sort;
    this.filter = filter;
    this.columns = columns;
    this.customColumns = customColumns;
    this.size = size;
    this.suppressFilter = suppressFilter;

    this.startRow = 0;
    this.endRow = 0;
    this.viewportColumns = [];
    this.pendingViewportUpdate = false;
    this.isClosed = false;
    this.isUncoalesced = false;
  }

  close() {}

  getViewportData() {
    const viewportData = this.makeViewportData();
    return Promise.resolve(viewportData);
  }

  setViewport(startRow, endRow, columns) {
    if (0 < NETWORK_DELAY) {
      setTimeout(() => {
        this.__setViewport(startRow, endRow, columns);
      }, NETWORK_DELAY);
    } else {
      this.__setViewport(startRow, endRow, columns);
    }
    return new TableViewportSubscription({ table: this });
  }

  __setViewport(startRow, endRow, columns) {
    this.startRow = startRow;
    this.endRow = endRow;
    this.viewportColumns = columns || this.columns;

    if (!this.pendingViewportUpdate) {
      this.fireViewportUpdate();
    }
  }

  makeViewportData() {
    const { startRow, endRow, viewportColumns, size, filter } = this;

    if (startRow == null || endRow == null || viewportColumns == null) {
      return null;
    }

    let rows = [];
    if (filter.length == 0 || !this.suppressFilter) {
      // Only return results for unfiltered tables for now
      for (let i = startRow; i <= endRow && i < size; i++) {
        const row = new Row({ index: i, name: `${i}` });
        rows.push(row);
      }
    }

    const viewportData = new ViewportData({
      offset: startRow,
      rows: rows,
      columns: viewportColumns,
    });

    return viewportData;
  }

  findColumns(names) {
    return names.map(name => {
      const column = this.columns.find(col => col.name === name);
      if (column === undefined) {
        throw new Error(`Column ${name} not found`);
      }
      return column;
    });
  }

  fireViewportUpdate() {
    const viewportData = this.makeViewportData();
    if (viewportData != null) {
      this.fireEvent(Table.EVENT_UPDATED, viewportData);
    }
  }

  getViewportData() {
    return Promise.resolve(this.makeViewportData());
  }

  applySort(sort) {
    this.sort = sort;
    this.pendingViewportUpdate = true;
    setTimeout(() => {
      this.pendingViewportUpdate = false;
      this.fireViewportUpdate();
    }, SORT_DELAY);
    return sort;
  }

  applyFilter(filter) {
    this.filter = filter;
    this.pendingViewportUpdate = true;
    setTimeout(() => {
      this.pendingViewportUpdate = false;
      this.fireViewportUpdate();
    }, FILTER_DELAY);
    return filter;
  }

  applyCustomColumns(customColumns) {
    this.customColums = customColumns;
    this.pendingViewportUpdate = true;
    setTimeout(() => {
      this.pendingViewportUpdate = false;
      this.fireViewportUpdate();
    }, CUSTOM_COLUMNS_DELAY);
    return customColumns;
  }

  getTotalsTable(config = {}) {
    return new Promise((resolve, reject) => {
      const table = makeDummyTotalsTable(config);
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  selectDistinct() {
    return new Promise((resolve, reject) => {
      const table = makeDummyTable();
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  copy() {
    return new Promise((resolve, reject) => {
      const table = new Table(this);
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  rollup() {
    return this.copy();
  }

  subscribe(columns, updateInterval = UPDATE_INTERVAL) {
    return new TableSubscription({
      table: this,
      updateInterval,
      initialUpdate: this.size,
      tickUpdate: this.size,
    });
  }
}

Table.EVENT_CUSTOMCOLUMNSCHANGED = 'customcolumnschanged';
Table.EVENT_FILTERCHANGED = 'filterchanged';
Table.EVENT_ROWADDED = 'rowadded';
Table.EVENT_ROWREMOVED = 'rowremoved';
Table.EVENT_ROWUPDATED = 'rowupdated';
Table.EVENT_SIZECHANGED = 'sizechanged';
Table.EVENT_SORTCHANGED = 'sortchanged';
Table.EVENT_UPDATED = 'updated';
Table.EVENT_CONNECT = 'connect';
Table.EVENT_DISCONNECT = 'disconnect';
Table.EVENT_RECONNECT = 'reconnect';

class TableViewportSubscription extends DeephavenObject {
  constructor({ table = makeDummyTable() } = {}) {
    super();

    this.table = table;
  }

  setViewport(firstRow, lastRow, columns = this.table.columns) {
    this.table.setViewport(firstRow, lastRow, columns);
  }

  getViewportData() {
    return this.table.getViewportData();
  }
}

class TableSubscription extends DeephavenObject {
  constructor({
    table = makeDummyTable(),
    initialUpdate = 1000,
    tickUpdate = 10,
    updateInterval = UPDATE_INTERVAL,
  } = {}) {
    super();

    this.table = table;
    this.initialUpdate = initialUpdate;
    this.tickUpdate = tickUpdate;

    let rowIndex = 0;
    this.timer = setInterval(() => {
      const size = rowIndex === 0 ? this.initialUpdate : this.tickUpdate;
      const added = new RangeSet(rowIndex, size);
      const updated = new RangeSet();
      const removed = new RangeSet();

      rowIndex += size;

      const eventData = new TableSubscriptionEventData(added, updated, removed);
      this.fireEvent(TableSubscription.EVENT_UPDATED, eventData);
    }, updateInterval);
  }

  close() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

TableSubscription.EVENT_UPDATED = 'updated';

class TableSubscriptionEventData {
  constructor(added, removed, updated) {
    this.rows = [];
    this.added = added;
    this.removed = removed;
    this.updated = updated;
  }

  get(rowIndex) {
    if (this.rows[rowIndex] == null) {
      this.rows[rowIndex] = new Row({ index: rowIndex });
    }
    return this.rows[rowIndex];
  }

  getData(rowIndex, column) {
    const row = this.get(rowIndex);
    return row.get(column);
  }

  getFormat(rowIndex, column) {
    const row = this.get(rowIndex);
    return row.getFormat(column);
  }
}

class RangeSet {
  static ofRange(first, last) {
    return new RangeSet(first, last - first + 1);
  }

  static ofRanges(ranges) {
    return ranges[0];
  }

  constructor(startIndex = 0, size = 0) {
    this.startIndex = startIndex;
    this.size = size;
  }

  iterator() {
    let nextIndex = this.startIndex;

    const iterator = {
      next: () => {
        const value = nextIndex;
        const done = !iterator.hasNext();
        nextIndex += 1;
        return { value, done };
      },

      hasNext: () => nextIndex - this.startIndex < this.size,
    };

    return iterator;
  }
}

class QueryInfo {
  constructor({
    name = 'Query',
    serial = '1',
    status = 'Status',
    tables = [],
    figures = [],
    objects = [],
    columnCount = COLUMN_COUNT,
    mockTables = {},
    mockFigures = {},
  } = {}) {
    this.name = name;
    this.serial = serial;
    this.status = status;
    this.tables = tables;
    this.figures = figures;
    this.objects = objects;
    this.columnCount = columnCount;
    this.mockTables = mockTables;
    this.mockFigures = mockFigures;
  }

  getTable(name) {
    return new Promise((resolve, reject) => {
      let table = this.mockTables[name];
      if (table == null) {
        table = makeDummyTable(this.columnCount);
      }
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  getFigure(name) {
    return new Promise((resolve, reject) => {
      let figure = this.mockFigures[name];
      if (figure == null) {
        figure = makeDummyFigure();
      }
      setTimeout(resolve, NETWORK_DELAY, figure);
    });
  }

  createWorkspaceData() {
    return Promise.resolve(makeId());
  }

  saveWorkspaceData() {
    return Promise.resolve();
  }
}

QueryInfo.EVENT_DISCONNECT = 'disconnect';

class TotalsTable extends Table {
  constructor(props) {
    super(props);

    const { config } = props;
    this.totalsTableConfig = config;
    this.size = 1;
  }
}

class TotalsTableConfig {}

TotalsTableConfig.COUNT = 'Count';
TotalsTableConfig.MIN = 'Min';
TotalsTableConfig.MAX = 'Max';
TotalsTableConfig.SUM = 'Sum';
TotalsTableConfig.VAR = 'Var';
TotalsTableConfig.AVG = 'Avg';
TotalsTableConfig.STD = 'Std';
TotalsTableConfig.FIRST = 'First';
TotalsTableConfig.LAST = 'Last';
TotalsTableConfig.SKIP = 'Skip';

class InputTable extends DeephavenObject {
  constructor({ keyColumns = [] } = {}) {
    super();

    this.keyColumns = keyColumns;
  }

  addRows() {
    return Promise.resolve();
  }

  deleteTable() {
    return Promise.resolve();
  }
}

class RollupTableConfig {}

class Client extends DeephavenObject {
  constructor(props = {}) {
    super(props);

    this.queryCount = props.queryCount || QUERY_COUNT;
    this.configs = props.configs || makeKnownConfigs();

    setTimeout(() => {
      this.fireEvent(dh.Client.EVENT_CONNECT);
    }, NETWORK_DELAY);
  }

  disconnect() {}

  reconnect() {}

  onConnected() {
    return Promise.resolve();
  }

  getAllGroups() {
    const groups = ['Default A', 'Default B', 'Default C'];
    return Promise.resolve(groups);
  }

  getAllUsers() {
    return Promise.resolve([]);
  }

  getGroupsForUser() {
    return Promise.resolve([]);
  }

  getJvmProfiles() {
    return Promise.resolve([]);
  }

  getQueryConstants() {
    return Promise.resolve([]);
  }

  getQueryTypes() {
    return Promise.resolve({});
  }

  getServerConfigValues() {
    return Promise.resolve({
      gradleVersion: 'Mock Gradle Version',
      javaVersion: 'Mock Java Version',
      vcsVersion: 'Mock VCS Version',
      hostName: 'Mock hostname',
      systemName: 'Mock system name',
      systemType: 'Mock system type',
      supportContact: 'Mock support',
      supportDocs: 'Mock docs',
      settingsLogoConfigured: false,
    });
  }

  getKnownConfigs() {
    return this.configs;
  }

  getDbServers() {
    return Promise.resolve([
      {
        host: 'https://localhost/mock',
        name: 'Mock Server',
        port: 123,
      },
    ]);
  }

  getAuthConfigValues() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([]);
      }, AUTH_CONFIG_LOADING_DELAY);
    });
  }

  getUserInfo() {
    return Promise.resolve({ username: 'username', operateAs: 'operateAs' });
  }

  login(loginInfo) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, NETWORK_DELAY, 'login');
      setTimeout(() => {
        for (let i = 0; i < this.queryCount; i++) {
          const query = new QueryInfo({
            name: `Query${i}`,
            serial: `${i}`,
            tables: ['Table A', 'Table B', 'Table C'],
          });
          this.fireEvent(Client.EVENT_CONFIG_ADDED, query);
        }
      }, NETWORK_DELAY * 2);
    });
  }

  createQuery() {
    return Promise.resolve(makeId());
  }

  saveQuery() {
    return Promise.resolve();
  }

  getBusinessCalendars() {
    return Promise.resolve(['A', 'B', 'C']);
  }

  getDefaultCalendar() {
    return Promise.resolve('A');
  }

  getTemporaryQueryTypes() {
    return Promise.resolve([]);
  }

  getEditableQuery() {
    return Promise.reject('Editable Queries not implemented in the API');
  }

  deleteQueries() {
    return Promise.resolve();
  }

  getScriptBody() {
    return Promise.resolve('');
  }

  getScriptPaths() {
    return Promise.resolve('');
  }

  getQuerySerialsForDependent() {
    return Promise.resolve([]);
  }

  getTemporaryQueueNames() {
    return Promise.resolve([]);
  }

  getDbServersForType() {
    return Promise.resolve([]);
  }
}

Client.EVENT_CONNECT = 'connect';
Client.EVENT_CONFIG_ADDED = 'configadded';
Client.EVENT_CONFIG_REMOVED = 'configremoved';
Client.EVENT_CONFIG_UPDATED = 'configupdated';
Client.EVENT_CONNECT = 'connect';
Client.EVENT_DISCONNECT = 'disconnect';
Client.EVENT_RECONNECT = 'reconnect';
Client.EVENT_RECONNECT_AUTH_FAILED = 'reconnectauthfailed';

class StorageService {
  listItems() {
    return Promise.resolve([]);
  }

  loadFile() {
    return Promise.resolve({
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer()),
    });
  }

  deleteItem() {
    return Promise.resolve();
  }
  saveFile() {
    return Promise.resolve();
  }
  moveItem() {
    return Promise.resolve();
  }
  createDirectory() {
    return Promise.resolve();
  }
}

class CoreClient {
  constructor(serverUrl) {
    this.storageService = new StorageService();
  }
  login() {
    return Promise.resolve();
  }

  getStorageService() {
    return this.storageService;
  }
}

class FileContents {
  static text(...text) {
    return new FileContents(text.join(''));
  }

  constructor(contents) {
    this.contents = contents;
  }

  text() {
    return Promise.resolve(this.contents);
  }
}

//
// CONSOLE START
//
class VariableChanges {
  /**
   *
   * @param {string[]} created Variables that were created
   * @param {string[]} updated Variables that were updated
   * @param {string[]} removed Variables that were removed
   */
  constructor(created, updated, removed) {
    this.created = created;
    this.updated = updated;
    this.removed = removed;
  }
}

class SuccessResult {
  /**
   * Create the result of a successful command
   * @param {VariableChanges} tableChanges
   * @param {VariableChanges} widgetChanges
   */
  constructor(tableChanges, widgetChanges) {
    this.tableChanges = tableChanges;
    this.widgetChanges = widgetChanges;
  }
}

class ErrorResult {
  constructor(message, stacktrace) {
    this.message = message;
    this.stacktrace = stacktrace;
  }
}

class IdeConnection extends DeephavenObject {
  /**
   * Retrieve an object with the specified definition
   * @param {JsVariableDefinition} variableDefinition The object definition to retrieve
   * @returns {Promise<Table>} A promise that resolves to the retrieved table
   */
  getObject(variableDefinition) {
    return new Promise((resolve, reject) => {
      try {
        const { type } = variableDefinition;
        switch (type) {
          case VariableType.FIGURE:
            const figure = makeDummyFigure(name);
            setTimeout(resolve, NETWORK_DELAY, figure);
            break;
          case VariableType.TABLE:
            const table = makeDummyTable();
            setTimeout(resolve, NETWORK_DELAY, table);
            break;
          default:
            throw new Error(`Unexpected object type ${type}`);
        }
      } catch (e) {
        reject(e);
      }
    });
  }
}

class IdeSession extends DeephavenObject {
  constructor(language) {
    super();

    this.language = language;
    this.tables = [];
    this.widgets = [];
  }

  onLogMessage(callback) {}

  close() {}
  /**
   * Execute the provided command in this console.
   * @param {string} command The command to execute. State will be updated on the server.
   * @return {Promise<SuccessResult, ErrorResult>} Return a CommandQuery that will resolve with the result of the command, or reject with an error. Can cancel() if possible.
   */
  runCode(command) {
    var timer = null;
    var rejectCallback = null;
    let promise = new Promise((resolve, reject) => {
      rejectCallback = reject;

      let delay = NETWORK_DELAY;
      if (command.startsWith('echo ')) {
        delay = 0;
      }

      let createdTables = new Set();
      let updatedTables = new Set();
      let removedTables = new Set();
      let createdWidgets = new Set();
      let updatedWidgets = new Set();
      let removedWidgets = new Set();
      let error = null;

      let lines = command.split('\n');
      for (let line of lines) {
        const trimmedLine = line.trim();
        let components = trimmedLine.split('=');
        if (components.length >= 2) {
          let name = components[0].trim();
          let value = components[1].trim();
          if (name.indexOf(' ') >= 0) {
            error = `Invalid variable name ${name}`;
          } else {
            if (value.startsWith('plot')) {
              if (this.widgets.indexOf(name) >= 0) {
                updatedWidgets.add(name);
              } else {
                createdWidgets.add(name);
              }
            } else {
              if (this.tables.indexOf(name) >= 0) {
                updatedTables.add(name);
              } else {
                createdTables.add(name);
              }
            }
          }
        } else if (components.length >= 1) {
          let command = components[0].trim();
          if (command === 'error') {
            error = `Error encountered at line 1: jfiodsa jofidja = fjdisoa [io.deephaven.db.util.DhDbGroovySession.maybeRewriteStackTrace(DhDbGroovySession.java:258), io.deephaven.db.util.DhDbGroovySession.wrapAndRewriteStackTrace(DhDbGroovySession.java:239), io.deephaven.db.util.DhDbGroovySession.evaluate(DhDbGroovySession.java:231), io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:94), io.deephaven.console.events.RemoteScriptCommandQuery.execute(RemoteScriptCommandQuery.java:26), io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.lambda$execute$0(RemoteQueryProcessor.java:1513), io.deephaven.db.tables.live.LiveTableMonitor.doLockedInterruptible(LiveTableMonitor.java:220), io.deephaven.db.tables.remotequery.RemoteQueryProcessor$QueryAction.execute(RemoteQueryProcessor.java:1513), io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.runSyncQueryAndSendResult(RemoteQueryProcessor.java:1304), io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler.handleCommandST(RemoteQueryProcessor.java:1231), io.deephaven.db.tables.remotequery.RemoteQueryProcessor$ClientConnectionHandler$HandleCommandRunnable.run(RemoteQueryProcessor.java:914), java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:511), java.util.concurrent.FutureTask.run(FutureTask.java:266), java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149), java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624), java.lang.Thread.run(Thread.java:748)]`;
          } else if (command.startsWith('echo ')) {
            error = command.substring(5);
          } else if (command.startsWith('del ')) {
            let removedComponent = component.substring(4);
            const tableIndex = this.tables.indexOf(removedComponent);
            if (0 <= tableIndex) {
              removedTables.add(removedComponent);
              this.tables.splice(tableIndex, 1);
            }

            const widgetIndex = this.widgets.indexOf(removedComponent);
            if (0 <= widgetIndex) {
              removedWidgets.add(removedComponent);
              this.widgets.splice(widgetIndex, 1);
            }
          } else if (command.startsWith('sleep ')) {
            delay = parseInt(command.substring(6));
          } else if (trimmedLine.length > 0) {
            error = `Unknown command: ${command}`;
          }
        }

        if (error) {
          break;
        }
      }

      const tableChanges = new VariableChanges(
        Array.from(createdTables),
        Array.from(updatedTables),
        Array.from(removedTables)
      );
      const widgetChanges = new VariableChanges(
        Array.from(createdWidgets),
        Array.from(updatedWidgets),
        Array.from(updatedWidgets)
      );
      const result = new SuccessResult(tableChanges, widgetChanges);
      if (error) {
        result.error = new ErrorResult(error, null);
      }

      timer = setTimeout(() => {
        resolve(result);
      }, delay);
    });

    promise.cancel = () => {
      if (timer) {
        clearTimeout(timer);
        const result = new ErrorResult('Cancelled', null);
        rejectCallback(result);
      }
    };

    this.fireEvent(IdeSession.EVENT_COMMANDSTARTED, {
      code: command,
      result: promise,
    });

    return promise;
  }

  /**
   * Retrieve a table with the specified table name
   * @param {string} name The table name to get
   * @returns {Promise<Table>} A promise that resolves to the retrieved table
   */
  getTable(name) {
    return new Promise((resolve, reject) => {
      const table = makeDummyTable();
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  getFigure(name) {
    return new Promise((resolve, reject) => {
      const figure = makeDummyFigure(name);
      setTimeout(resolve, NETWORK_DELAY, figure);
    });
  }

  openDocument() {}
  changeDocument() {}
  getCompletionItems() {
    return Promise.resolve([]);
  }
  closeDocument() {}

  newTable(columnNames, types, data, userTimeZone) {
    return new Promise((resolve, reject) => {
      const table = makeDummyTable();
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  mergeTables(tables) {
    return new Promise((resolve, reject) => {
      const table = makeDummyTable();
      setTimeout(resolve, NETWORK_DELAY, table);
    });
  }

  bindTableToVariable(table, name) {
    return Promise.resolve();
  }
}

IdeSession.EVENT_COMMANDSTARTED = 'commandstarted';

const VariableType = Object.freeze({
  TABLE: 'Table',
  TABLEMAP: 'TableMap',
  TREETABLE: 'TreeTable',
  FIGURE: 'Figure',
  OTHERWIDGET: 'OtherWidget',
  PANDAS: 'Pandas',
});

//
// CONSOLE END
//

class Figure extends DeephavenObject {
  constructor({
    title = '',
    charts = [],
    initialUpdateSize = 100,
    updateInterval = UPDATE_INTERVAL,
    updateSize = 10,
    rows = 1,
    cols = 1,
  } = {}) {
    super();

    this.title = title;
    this.charts = charts;

    this.initialUpdateSize = initialUpdateSize;
    this.updateInterval = updateInterval;
    this.updateSize = updateSize;
    this.timer = null;
    this.listenerCount = 0;
    this.rowIndex = 0;
    this.rows = rows;
    this.cols = cols;
  }

  addEventListener(...args) {
    super.addEventListener(...args);

    this.listenerCount += 1;

    if (this.listenerCount === 1) {
      this.startUpdateTimer();
    }
  }

  removeEventListener(...args) {
    super.removeEventListener(...args);

    this.listenerCount -= 1;

    if (this.listenerCount === 0) {
      this.stopUpdateTimer();
    }
  }

  startUpdateTimer() {
    const series = [];
    for (let i = 0; i < this.charts.length; i += 1) {
      const chart = this.charts[i];
      series.push(...chart.series);
    }

    const seriesDataMap = new Map();
    for (let i = 0; i < series.length; i += 1) {
      const s = series[i];
      const seriesData = {};
      const { sources } = s;
      for (let j = 0; j < sources.length; j += 1) {
        const source = sources[j];
        const sourceType = source.axis.type;
        seriesData[sourceType] = [];
      }
      seriesDataMap.set(s, seriesData);
    }

    this.timer = setInterval(() => {
      const updateSize =
        this.rowIndex > 0 ? this.updateSize : this.initialUpdateSize;

      for (let i = 0; i < series.length; i += 1) {
        const s = series[i];
        const seriesData = seriesDataMap.get(s);
        const { sources } = s;
        for (let j = 0; j < sources.length; j += 1) {
          const source = sources[j];
          const sourceType = source.axis.type;
          const sourceData = seriesData[sourceType];
          for (let r = 0; r < updateSize; r += 1) {
            if (sourceType === AxisType.Y) {
              sourceData.push(Math.sin(r + this.rowIndex));
            } else {
              sourceData.push(r + this.rowIndex);
            }
          }
        }
      }

      const figureUpdateEvent = new FigureUpdateEventData(
        series,
        seriesDataMap
      );

      this.fireEvent(Figure.EVENT_UPDATED, figureUpdateEvent);

      this.rowIndex += updateSize;
    }, this.updateInterval);
  }

  stopUpdateTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.rowIndex = 0;
    }
  }

  subscribe() {}
  unsubscribe() {}
  close() {}
}

Figure.EVENT_UPDATED = 'updated';
Figure.EVENT_DISCONNECT = 'disconnect';
Figure.EVENT_RECONNECT = 'reconnect';
Figure.EVENT_SERIES_ADDED = 'seriesadded';
Figure.EVENT_RECONNECTFAILED = 'reconnectfailed';
Figure.EVENT_DOWNSAMPLESTARTED = 'downsamplestarted';
Figure.EVENT_DOWNSAMPLEFINISHED = 'downsamplefinished';
Figure.EVENT_DOWNSAMPLEFAILED = 'downsamplefailed';
Figure.EVENT_DOWNSAMPLENEEDED = 'downsampleneeded';
Figure.create = source => Promise.resolve(new Figure());

class FigureUpdateEventData {
  constructor(series, dataMap) {
    this.series = series;
    this.dataMap = dataMap;
  }

  getArray(series, sourceType, mappingFunc) {
    const seriesData = this.dataMap.get(series);
    let data = seriesData[sourceType];
    if (mappingFunc) {
      data = data.map(mappingFunc);
    }
    return data;
  }
}

class SeriesDataSource {
  constructor({ axis, type }) {
    this.axis = axis;
    this.type = type;
  }
}

class Chart {
  constructor({
    title = '',
    series = [],
    axes = [],
    colspan = 1,
    rowspan = 1,
    column = 0,
    row = 0,
    showLegend = null,
  }) {
    this.title = title;
    this.series = series;
    this.axes = axes;
    this.rowspan = rowspan;
    this.colspan = colspan;
    this.column = column;
    this.row = row;
    this.showLegend = showLegend;
  }
}

class Series extends DeephavenObject {
  constructor(
    name = '',
    plotStyle = SeriesPlotStyle.SCATTER,
    sources = [],
    lineColor = null,
    shapeColor = null
  ) {
    super();

    this.name = name;
    this.plotStyle = plotStyle;
    this.sources = sources;
    this.lineColor = lineColor;
    this.shapeColor = shapeColor;
  }

  subscribe() {}
  unsubscribe() {}
}

class Axis {
  constructor({
    label,
    type,
    position,
    formatType,
    formatPattern = null,
    log = false,
    businessCalendar = null,
  } = {}) {
    this.label = label;
    this.type = type;
    this.position = position;
    this.formatType = formatType;
    this.formatPattern = formatPattern;
    this.log = log;
    this.businessCalendar = businessCalendar;
  }

  range() {}
}

class BusinessPeriod {
  constructor(open, close) {
    this.open = open;
    this.close = close;
  }
}

class Holiday {
  constructor(date, businessPeriods) {
    this.date = date;
    this.businessPeriods = businessPeriods;
  }
}

class NumberFormat {
  static parse(pattern, text) {
    if (pattern.indexOf('.') >= 0) {
      return Number.parseFloat(text);
    } else {
      return Number.parseInt(text);
    }
  }

  static format(pattern, number) {
    if (pattern.indexOf('.') >= 0) {
      return number.toFixed(4);
    } else {
      return number.toFixed(0);
    }
  }
}

class DateTimeFormat {
  static format(pattern, date) {
    return date.toLocaleString();
  }

  static parse(format, dateString) {
    return new DateWrapper(Date.parse(dateString));
  }

  static parseAsDate(pattern, text) {
    return new Date(text);
  }
}

class LongWrapper {
  constructor(value) {
    this.value = value;
  }

  static ofString(str) {
    return new LongWrapper(str);
  }

  asNumber() {
    return parseFloat(value, 10);
  }

  valueOf() {
    return this.toString();
  }

  toString() {
    return `${this.value}`;
  }
}

class DateWrapper extends LongWrapper {
  constructor(millis) {
    super(`${millis}`);

    this.millis = millis;
  }

  static ofJsDate(date) {
    return new DateWrapper(date.getTime());
  }

  asDate() {
    return new Date(this.millis);
  }
}

class TimeZone {
  static getTimeZone(id) {
    if (id == null || id === '' || id.includes(' ')) {
      // Usually there would be a java.lang.IllegalArgumentException for any invalid id.
      // We at least know that '' and undefined, so throw an error.
      throw new Error('Unsupported time zone');
    }
    return { id };
  }
}

class AxisFormatType {
  static CATEGORY = 'CATEGORY';
  static NUMBER = 'NUMBER';
}

class AxisPosition {
  static BOTTOM = 'BOTTOM';
  static LEFT = 'LEFT';
  static NONE = 'NONE';
  static RIGHT = 'RIGHT';
  static TOP = 'TOP';
}

class AxisType {
  static COLOR = 'COLOR';
  static lABEL = 'LABEL';
  static SHAPE = 'SHAPE';
  static SIZE = 'SIZE';
  static X = 'X';
  static Y = 'Y';
  static Z = 'Z';
}

class ChartType {
  static CATEGORY = 'CATEGORY';
  static CATEGORY_3D = 'CATEGORY_3D';
  static OHLC = 'OHLC';
  static PIE = 'PIE';
  static XY = 'XY';
  static XYZ = 'XYZ';
}

class DayOfWeek {
  static SUNDAY = 'SUNDAY';
  static MONDAY = 'MONDAY';
  static TUESDAY = 'TUESDAY';
  static WEDNESDAY = 'WEDNESDAY';
  static THURSDAY = 'THURSDAY';
  static FRIDAY = 'FRIDAY';
  static SATURDAY = 'SATURDAY';
  static values() {
    return [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
  }
}

class DownsampleOptions {
  static MAX_SERIES_SIZE = 30000;
  static MAX_SUBSCRIPTION_SIZE = 200000;
  static DEFAULT = 'DEFAULT';
  static DISABLE = 'DISABLE';
}

class SeriesPlotStyle {
  static AREA = 'AREA';
  static BAR = 'BAR';
  static ERROR_BAR = 'ERROR_BAR';
  static HISTOGRAM = 'HISTOGRAM';
  static LINE = 'LINE';
  static OHLC = 'OHLC';
  static PIE = 'PIE';
  static SCATTER = 'SCATTER';
  static STACKED_AREA = 'STACKED_AREA';
  static STACKED_BAR = 'STACKED_BAR';
  static STEP = 'STEP';
}

class SourceType {
  static CLOSE = 'CLOSE';
  static COLOR = 'COLOR';
  static HIGH = 'HIGH';
  static LABEL = 'LABEL';
  static LOW = 'LOW';
  static OPEN = 'OPEN';
  static SHAPE = 'SHAPE';
  static SIZE = 'SIZE';
  static TIME = 'TIME';
  static X = 'X';
  static X_HIGH = 'X_HIGH';
  static X_LOW = 'X_LOW';
  static Y = 'Y';
  static Y_HIGH = 'Y_HIGH';
  static Y_LOW = 'Y_LOW';
  static Z = 'Z';
}

const dh = {
  FilterCondition: FilterCondition,
  FilterValue: FilterValue,
  Client: Client,
  CoreClient: CoreClient,
  RollupTableConfig: RollupTableConfig,
  Table: Table,
  TotalsTable: TotalsTable,
  InputTable: InputTable,
  TotalsTableConfig: TotalsTableConfig,
  TableViewportSubscription,
  TableSubscription,
  Column: Column,
  RangeSet,
  Row: Row,
  Sort: Sort,
  IdeConnection: IdeConnection,
  IdeSession: IdeSession,
  QueryInfo,
  Chart,
  Axis,
  BusinessPeriod,
  Holiday,
  Series,
  SeriesDataSource,
  i18n: {
    NumberFormat,
    DateTimeFormat,
    TimeZone,
  },
  plot: {
    AxisFormatType,
    AxisPosition,
    AxisType,
    ChartType,
    DownsampleOptions,
    Figure,
    SeriesPlotStyle,
    SourceType,
  },
  calendar: {
    DayOfWeek,
  },
  DateWrapper: DateWrapper,
  ViewportData,
  VariableType,
  storage: {
    FileContents: FileContents,
  },
};

// The actual library just sets a global window object, we do the same
window.dh = dh;
