import Papa, { ParseLocalConfig, Parser, ParseResult } from 'papaparse';
import Log from '@deephaven/log';
import { assertNotNull, DbNameValidator } from '@deephaven/utils';
import type { IdeSession, Table } from '@deephaven/jsapi-types';
import type { JSZipObject } from 'jszip';
import CsvTypeParser from './CsvTypeParser';
import { CsvTypes } from './CsvFormats';

const log = Log.module('CsvParser');

// This is based on jszip streaming ~15 KB chunks to papa parse
// Want to consolidate to ~10 MB chunks
const ZIP_CONSOLIDATE_CHUNKS = 650;

interface CsvParserConstructor {
  onFileCompleted: (tables: Table[]) => void;
  session: IdeSession;
  file: Blob | JSZipObject;
  type: CsvTypes;
  readHeaders: boolean;
  onProgress: (progressValue: number) => boolean;
  onError: (e: unknown) => void;
  timeZone: string;
  isZip: boolean;
}

/**
 * Parser a CSV file in chunks and returns a table handle for each chunk.
 */
class CsvParser {
  // Generates column names A-Z, AA-AZ, BA-BZ, etc...
  static generateHeaders = (numColumns: number): string[] => {
    const headers = [];
    for (let i = 0; i < numColumns; i += 1) {
      headers.push(CsvParser.generateHeaderRecursive(i));
    }
    return headers;
  };

  static generateHeaderRecursive(n: number): string {
    let header = '';
    let char = n;
    if (n >= 26) {
      header = header.concat(
        CsvParser.generateHeaderRecursive(Math.floor(n / 26) - 1)
      );
      char = n % 26;
    }
    return header.concat(String.fromCharCode(65 + char));
  }

  constructor({
    onFileCompleted,
    session,
    file,
    type,
    readHeaders = true,
    onProgress,
    onError,
    timeZone,
    isZip,
  }: CsvParserConstructor) {
    this.onFileCompleted = onFileCompleted;
    this.session = session;
    this.file = file;
    this.isZip = isZip;
    this.type = type;
    this.readHeaders = readHeaders;
    this.timeZone = timeZone;
    this.onProgress = onProgress;
    this.onError = onError;
    this.tables = [];
    this.chunks = 0;
    this.totalChunks = isZip
      ? 0
      : Math.ceil((file as Blob).size / Papa.LocalChunkSize);
    this.isComplete = false;
    this.zipProgress = 0;
    this.numConsolidated = 0;
    this.isCancelled = false;

    this.handleChunk = this.handleChunk.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleComplete = this.handleComplete.bind(this);
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this);
    this.handleCreateTable = this.handleCreateTable.bind(this);

    this.config = {
      delimiter: type.delimiter,
      newline: type.newline as '\r\n' | '\n' | '\r' | undefined,
      escapeChar: type.escapeChar,
      dynamicTyping: false,
      error: this.handleError,
      skipEmptyLines: type.skipEmptyLines,
      chunk: this.handleChunk,
      complete: this.handleComplete,
      fastMode: false,
    };
  }

  onFileCompleted: (tables: Table[]) => void;

  session: IdeSession;

  file: Blob | JSZipObject;

  isZip: boolean;

  type: CsvTypes;

  readHeaders: boolean;

  timeZone: string;

  onProgress: (progressValue: number) => boolean;

  onError: (e: unknown) => void;

  tables: Table[];

  headers?: string[];

  types?: string[];

  chunks: number;

  totalChunks: number;

  isComplete: boolean;

  zipProgress: number;

  consolidatedChunks?: string[][];

  numConsolidated: number;

  isCancelled: boolean;

  config: ParseLocalConfig<unknown, Blob | NodeJS.ReadableStream>;

  cancel(): void {
    this.isCancelled = true;
  }

  transpose(numColumns: number, array: string[][]): string[][] {
    const numRows = array.length;
    const columns = new Array(numColumns)
      .fill(null)
      .map(() => new Array(numRows));
    for (let r = 0; r < numRows; r += 1) {
      const row = array[r];
      if (row.length < numColumns) {
        throw new Error(
          `Insufficient columns. Expected ${numColumns} but found ${row.length}\n${row}`
        );
      }
      for (let c = 0; c < numColumns; c += 1) {
        const value = this.type.shouldTrim ? array[r][c].trim() : array[r][c];
        columns[c][r] = this.nullCheck(value);
      }
    }
    return columns as string[][];
  }

  nullCheck(value: string): string {
    return value === this.type.nullString ? '' : value;
  }

  parse(): void {
    const handleParseDone = (types: string[]) => {
      const toParse = this.isZip
        ? (this.file as JSZipObject).nodeStream(
            // JsZip types are incorrect, thus the funny casting
            // Actual parameter is 'nodebuffer'
            'nodebuffer' as 'nodestream',
            this.handleNodeUpdate
          )
        : (this.file as Blob);
      this.types = types;
      Papa.parse(toParse, this.config);
    };
    const typeParser = new CsvTypeParser(
      handleParseDone,
      this.file,
      this.readHeaders,
      this.config,
      this.type.nullString,
      this.onProgress,
      this.onError,
      this.totalChunks,
      this.isZip,
      this.type.shouldTrim
    );
    typeParser.parse();
  }

  handleChunk(result: ParseResult<string[]>, parser: Parser): void {
    const { readHeaders, onError, handleCreateTable, isZip, tables } = this;
    if (this.isCancelled) {
      log.debug2('CSV parser cancelled.');
      parser.abort();
      tables.forEach(t => t.close());
      return;
    }
    let { data } = result;
    if (!this.headers) {
      if (readHeaders) {
        this.headers = DbNameValidator.legalizeColumnNames(data[0]);
        data = data.slice(1);
      } else {
        this.headers = CsvParser.generateHeaders(data[0].length);
      }
    }

    let columns: string[][] = [];
    try {
      columns = this.transpose(this.headers.length, data);
      if (isZip) {
        // Zip file chunks are tiny, so consolidate them to avoid create thousands of small tables
        this.consolidateChunks(columns, parser);
      } else {
        const index = this.chunks;
        this.chunks += 1;
        handleCreateTable(index, columns, parser);
      }
    } catch (e: unknown) {
      onError(e);
    }
  }

  consolidateChunks(columns: string[][], parser: Parser): void {
    if (!this.consolidatedChunks) {
      this.consolidatedChunks = columns.slice();
    } else {
      for (let i = 0; i < columns.length; i += 1) {
        this.consolidatedChunks[i] = this.consolidatedChunks[i].concat(
          columns[i]
        );
      }
    }
    this.numConsolidated += 1;
    if (this.numConsolidated >= ZIP_CONSOLIDATE_CHUNKS || this.isComplete) {
      this.uploadConsolidatedChunks(parser);
    }
  }

  uploadConsolidatedChunks(parser: Parser | null): void {
    const { handleCreateTable } = this;
    const index = this.chunks;
    this.chunks += 1;
    const toUpload = this.consolidatedChunks?.slice();
    this.consolidatedChunks = undefined;
    this.numConsolidated = 0;
    assertNotNull(toUpload);
    handleCreateTable(index, toUpload, parser);
  }

  handleCreateTable(
    index: number,
    columns: string[][],
    parser: Parser | null
  ): void {
    const {
      session,
      tables,
      onFileCompleted,
      totalChunks,
      types,
      onProgress,
      onError,
    } = this;
    if (parser) {
      parser.pause();
    }
    assertNotNull(this.headers);
    assertNotNull(types);
    session
      .newTable(this.headers, types, columns, this.timeZone)
      .then(table => {
        if (this.isCancelled) {
          log.debug2('CSV parser cancelled.');
          if (parser) {
            parser.abort();
          }
          tables.forEach(t => t.close());
          return;
        }
        if (parser) {
          parser.resume();
        }
        tables[index] = table;
        // This accounts for 50% of parsing plus 50% already done by the type parser
        let progress = 0;
        if (totalChunks > 0) {
          progress = Math.round((tables.length / totalChunks) * 50) + 50;
        } else {
          progress = Math.round(50 + this.zipProgress / 2);
        }
        log.debug2(`CSV parser progress ${progress}`);
        onProgress(progress);
        if (this.isComplete && tables.length === this.chunks) {
          log.debug2('CSV parser complete.');
          onFileCompleted(tables);
        }
      })
      .catch(e => {
        if (!this.isComplete && parser) {
          parser.abort();
        }
        onError(e);
      });
  }

  handleComplete(results: ParseResult<unknown>): void {
    // results is undefined for a succesful parse, but has meta data for an abort
    if (results == null || results.meta.aborted == null) {
      this.isComplete = true;
      // Check if there are any consolidated chunks left over from a zip file
      if (this.consolidatedChunks) {
        this.uploadConsolidatedChunks(null);
      }
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

export default CsvParser;
