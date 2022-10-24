import type { JSZipObject } from 'jszip';
import { assertNotNull } from '@deephaven/utils';
import Papa, { Parser, ParseResult, ParseLocalConfig } from 'papaparse';
// Intentionally using isNaN rather than Number.isNaN
/* eslint-disable no-restricted-globals */
import NewTableColumnTypes from './NewTableColumnTypes';

// Initially column types start al unknown
const UNKNOWN = 'unknown';

const MAX_INT = 2147483647;
const MIN_INT = -2147483648;

const DATE_TIME_REGEX = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9][ T][0-2][0-9]:[0-5][0-9]:[0-6][0-9](?:\.[0-9]{1,9})?(?: [a-zA-Z]+)?$/;
const LOCAL_TIME_REGEX = /^([0-9]+T)?([0-9]+):([0-9]+)(:[0-9]+)?(?:\.[0-9]{1,9})?$/;

/**
 * Determines the type of each column in a CSV file by parsing it and looking at every value.
 */
class CsvTypeParser {
  static determineType(
    value: string,
    type: string,
    nullString: string | null
  ): string {
    if (!value || value === nullString) {
      // A null tells us nothing about the type
      return type;
    }

    switch (type) {
      case NewTableColumnTypes.STRING:
        // Strings never get promoted
        return NewTableColumnTypes.STRING;
      case NewTableColumnTypes.INTEGER:
        return CsvTypeParser.checkInteger(value);
      case NewTableColumnTypes.LONG:
        return CsvTypeParser.checkLong(value);
      case NewTableColumnTypes.DOUBLE:
        return CsvTypeParser.checkDouble(value);
      case NewTableColumnTypes.BOOLEAN:
        return CsvTypeParser.checkBoolean(value);
      case NewTableColumnTypes.DATE_TIME:
        return CsvTypeParser.checkDateTime(value);
      case NewTableColumnTypes.LOCAL_TIME:
        return CsvTypeParser.checkLocalTime(value);
      default:
        return CsvTypeParser.getTypeFromUnknown(value);
    }
  }

  // Allows for cusomt rules in addition to isNaN
  static isNotParsableNumber(s: string): boolean {
    return (
      isNaN((s as unknown) as number) || s === 'Infinity' || s === '-Infinity'
    );
  }

  static checkInteger(value: string): string {
    const noCommas = value.replace(/,/g, '');
    if (CsvTypeParser.isNotParsableNumber(noCommas)) {
      return NewTableColumnTypes.STRING;
    }

    return CsvTypeParser.getNumberType(noCommas);
  }

  static checkLong(value: string): string {
    const noCommas = value.replace(/,/g, '');
    if (CsvTypeParser.isNotParsableNumber(noCommas)) {
      return NewTableColumnTypes.STRING;
    }

    if (noCommas.includes('.')) {
      return NewTableColumnTypes.DOUBLE;
    }

    return NewTableColumnTypes.LONG;
  }

  static checkDouble(value: string): string {
    const noCommas = value.replace(/,/g, '');
    if (CsvTypeParser.isNotParsableNumber(noCommas)) {
      return NewTableColumnTypes.STRING;
    }

    return NewTableColumnTypes.DOUBLE;
  }

  static checkBoolean(value: string): string {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === 'false') {
      return NewTableColumnTypes.BOOLEAN;
    }
    return NewTableColumnTypes.STRING;
  }

  static checkDateTime(value: string): string {
    if (DATE_TIME_REGEX.test(value)) {
      return NewTableColumnTypes.DATE_TIME;
    }

    return NewTableColumnTypes.STRING;
  }

  static checkLocalTime(value: string): string {
    if (LOCAL_TIME_REGEX.test(value)) {
      return NewTableColumnTypes.LOCAL_TIME;
    }

    return NewTableColumnTypes.STRING;
  }

  static getTypeFromUnknown(value: string): string {
    const noCommas = value.replace(/,/g, '');
    if (CsvTypeParser.isNotParsableNumber(noCommas)) {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === 'false') {
        return NewTableColumnTypes.BOOLEAN;
      }

      if (DATE_TIME_REGEX.test(value) && value.includes(':')) {
        return NewTableColumnTypes.DATE_TIME;
      }

      if (LOCAL_TIME_REGEX.test(value)) {
        return NewTableColumnTypes.LOCAL_TIME;
      }

      return NewTableColumnTypes.STRING;
    }

    return CsvTypeParser.getNumberType(noCommas);
  }

  static getNumberType(value: string): string {
    if (value.includes('.')) {
      return NewTableColumnTypes.DOUBLE;
    }

    // Fast length check
    const maxIntLength = value.startsWith('-') ? 11 : 10;
    if (value.length > maxIntLength) {
      return NewTableColumnTypes.LONG;
    }

    // Slower parseInt check
    const intValue = parseInt(value, 10);
    if (intValue > MAX_INT || intValue < MIN_INT) {
      return NewTableColumnTypes.LONG;
    }

    return NewTableColumnTypes.INTEGER;
  }

  constructor(
    onFileCompleted: (types: string[]) => void,
    file: Blob | JSZipObject,
    readHeaders: boolean,
    parentConfig: ParseLocalConfig<unknown, Blob | NodeJS.ReadableStream>,
    nullString: string | null,
    onProgress: (progressValue: number) => boolean,
    onError: (e: unknown) => void,
    totalChunks: number,
    isZip: boolean,
    shouldTrim: boolean
  ) {
    this.onFileCompleted = onFileCompleted;
    this.file = file;
    this.readHeaders = readHeaders;
    this.nullString = nullString;
    this.onProgress = onProgress;
    this.onError = onError;
    this.chunks = 0;
    this.totalChunks = totalChunks;
    this.isZip = isZip;
    this.shouldTrim = shouldTrim;
    this.zipProgress = 0;

    this.handleChunk = this.handleChunk.bind(this);
    this.handleComplete = this.handleComplete.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this);

    this.config = {
      ...parentConfig,
      error: this.handleError,
      chunk: this.handleChunk,
      complete: this.handleComplete,
    };
  }

  onFileCompleted: (types: string[]) => void;

  file: Blob | JSZipObject;

  readHeaders: boolean;

  nullString: string | null;

  onProgress: (progressValue: number) => boolean;

  onError: (e: unknown) => void;

  types?: string[];

  chunks: number;

  totalChunks: number;

  isZip: boolean;

  shouldTrim: boolean;

  zipProgress: number;

  config: ParseLocalConfig<unknown, Blob | NodeJS.ReadableStream>;

  parse(): void {
    const toParse = this.isZip
      ? (this.file as JSZipObject).nodeStream(
          // JsZip types are incorrect, thus the funny casting
          // Actual parameter is 'nodebuffer'
          'nodebuffer' as 'nodestream',
          this.handleNodeUpdate
        )
      : (this.file as Blob);
    Papa.parse(toParse, this.config);
  }

  handleChunk(result: ParseResult<string[]>, parser: Parser): void {
    let { data } = result;
    if (!this.types) {
      if (data == null || data.length === 0) {
        parser.abort();
        this.onError('Error parsing CSV: no data in file.');
        return;
      }
      this.types = new Array(data[0].length).fill(UNKNOWN);
      if (this.readHeaders) {
        // If headers are being read from the file, remove them from type analysis
        data = data.slice(1);
      }
    }

    assertNotNull(this.types);

    const cloneTypes = [...this.types];

    data.forEach(row => {
      if (row.length >= cloneTypes.length) {
        for (let i = 0; i < cloneTypes.length; i += 1) {
          cloneTypes[i] = CsvTypeParser.determineType(
            this.shouldTrim ? row[i].trim() : row[i],
            cloneTypes[i],
            this.nullString
          );
        }
        this.types = cloneTypes;
      } else {
        parser.abort();
        this.onError(
          `Error parsing CSV: Insufficient data in row.\nExpected length ${cloneTypes.length} but found ${row.length}.\nRow = ${row}`
        );
      }
    });

    this.chunks += 1;
    // 50 because the type parsing accounts for 50% of the parsing
    let progress = 0;
    if (this.totalChunks > 0) {
      progress = Math.round((this.chunks / this.totalChunks) * 50);
    } else {
      progress = Math.round(this.zipProgress / 2);
    }
    const isCancelled = this.onProgress(progress);
    if (isCancelled) {
      parser.abort();
    }
  }

  handleComplete(results: ParseResult<unknown>): void {
    const { types, onFileCompleted } = this;
    // results is undefined for a succesful parse, but has meta data for an abort
    assertNotNull(types);
    if (results == null || !results.meta.aborted) {
      onFileCompleted(
        types.map(type =>
          type === UNKNOWN ? NewTableColumnTypes.STRING : type
        )
      );
    }
  }

  handleError(error: unknown): void {
    const { onError } = this;
    onError(error);
  }

  handleNodeUpdate(metadata: { percent: number }): void {
    this.zipProgress = metadata.percent;
  }
}

export default CsvTypeParser;
