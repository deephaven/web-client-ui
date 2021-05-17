import Papa from 'papaparse';
import Log from '@deephaven/log';
import { DbNameValidator } from '@deephaven/utils';
import CsvTypeParser from './CsvTypeParser';

const log = Log.module('CsvParser');

// This is based on jszip streaming ~15 KB chunks to papa parse
// Want to consolidate to ~10 MB chunks
const ZIP_CONSOLIDATE_CHUNKS = 650;

/**
 * Parser a CSV file in chunks and returns a table handle for each chunk.
 */
class CsvParser {
  // Generates column names A-Z, AA-AZ, BA-BZ, etc...
  static generateHeaders = numColumns => {
    const headers = [];
    for (let i = 0; i < numColumns; i += 1) {
      headers.push(CsvParser.generateHeaderRecursive(i));
    }
    return headers;
  };

  static generateHeaderRecursive(n) {
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
  }) {
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
    this.headers = null;
    this.types = null;
    this.chunks = 0;
    this.totalChunks = isZip ? 0 : Math.ceil(file.size / Papa.LocalChunkSize);
    this.isComplete = false;
    this.zipProgress = 0;
    this.consolidatedChunks = null;
    this.numConsolidated = 0;
    this.isCancelled = false;

    this.handleChunk = this.handleChunk.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleComplete = this.handleComplete.bind(this);
    this.handleNodeUpdate = this.handleNodeUpdate.bind(this);
    this.handleCreateTable = this.handleCreateTable.bind(this);

    this.config = {
      delimiter: type.delimiter,
      newline: type.newline,
      escapeChar: type.escapeChar,
      dynamicTyping: false,
      error: this.handleError,
      skipEmptyLines: type.skipEmptyLines,
      chunk: this.handleChunk,
      complete: this.handleComplete,
      fastMode: false,
    };
  }

  cancel() {
    this.isCancelled = true;
  }

  transpose(numColumns, array) {
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
    return columns;
  }

  nullCheck(value) {
    return value === this.type.nullString ? '' : value;
  }

  parse() {
    const handleParseDone = types => {
      const toParse = this.isZip
        ? this.file.nodeStream('nodebuffer', this.handleNodeUpdate)
        : this.file;
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

  handleChunk(result, parser) {
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

    let columns = [];
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
    } catch (e) {
      onError(e);
    }
  }

  consolidateChunks(columns, parser) {
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

  uploadConsolidatedChunks(parser) {
    const { handleCreateTable } = this;
    const index = this.chunks;
    this.chunks += 1;
    const toUpload = this.consolidatedChunks.slice();
    this.consolidatedChunks = null;
    this.numConsolidated = 0;
    handleCreateTable(index, toUpload, parser);
  }

  handleCreateTable(index, columns, parser) {
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

  handleComplete(results) {
    // results is undefined for a succesful parse, but has meta data for an abort
    if (!results || !results.meta.aborted) {
      this.isComplete = true;
      // Check if there are any consolidated chunks left over from a zip file
      if (this.consolidatedChunks) {
        this.uploadConsolidatedChunks(null);
      }
    }
  }

  handleError(error) {
    const { onError } = this;
    onError(error);
  }

  handleNodeUpdate(metadata) {
    this.zipProgress = metadata.percent;
  }
}

export default CsvParser;
