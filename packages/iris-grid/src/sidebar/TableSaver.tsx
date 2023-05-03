import { PureComponent } from 'react';
import {
  Column,
  dh as DhType,
  DateWrapper,
  Table,
  TableData,
  TableViewportSubscription,
  UpdateEventData,
} from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { GridRange, GridRangeIndex, memoizeClear } from '@deephaven/grid';
import { Formatter, FormatterUtils, TableUtils } from '@deephaven/jsapi-utils';
import {
  CancelablePromise,
  PromiseUtils,
  assertNotNull,
} from '@deephaven/utils';
import IrisGridUtils from '../IrisGridUtils';

const log = Log.module('TableSaver');

const UNFORMATTED_DATE_PATTERN = `yyyy-MM-dd'T'HH:mm:ss.SSSSSSSSS z`;

interface TableSaverProps {
  dh: DhType;
  getDownloadWorker: () => Promise<ServiceWorker>;
  isDownloading: boolean;
  onDownloadCompleted: () => void;
  onDownloadCanceled: () => void;
  onDownloadProgressUpdate: (
    progress: number,
    estimatedTime: number | null
  ) => void;
  formatter: Formatter;
}

function isUpdateEventData(data: TableData): data is UpdateEventData {
  return (data as UpdateEventData).added !== undefined;
}

function assertIsUpdateEventData(
  data: TableData
): asserts data is UpdateEventData {
  if (!isUpdateEventData(data)) {
    throw new Error('event is not UpdateEventData');
  }
}

export default class TableSaver extends PureComponent<
  TableSaverProps,
  Record<string, never>
> {
  static DOWNLOAD_CELL_CHUNK = 6000;

  static SNAPSHOT_BUFFER_SIZE = 5;

  static STREAM_TIMEOUT = 8000;

  static SNAPSHOT_HANDLER_TIMEOUT = 5;

  static defaultProps = {
    getDownloadWorker: (): Promise<never> =>
      Promise.reject(new Error('Download worker not provided')),
    isDownloading: false,
    onDownloadCompleted: (): void => undefined,
    onDownloadCanceled: (): void => undefined,
    onDownloadProgressUpdate: (): void => undefined,
  };

  static csvEscapeString(str: string): string {
    return `"${str.replace(/"/g, '""')}"`;
  }

  constructor(props: TableSaverProps) {
    super(props);

    this.handlePortMessage = this.handlePortMessage.bind(this);
    this.handleSnapshotResolved = this.handleSnapshotResolved.bind(this);
    this.handleDownloadTimeout = this.handleDownloadTimeout.bind(this);

    this.state = {};

    this.gridRanges = [];
    this.gridRangeCounter = 0;
    this.rangedSnapshotsTotal = [];
    this.rangedSnapshotCounter = 0;

    this.includeColumnHeaders = true;
    this.useUnformattedValues = false;

    this.snapshotsTotal = 0;
    this.snapshotCounter = 0;
    this.snapshotsBuffer = new Map();

    this.currentSnapshotIndex = 0;
    this.snapshotPending = 0;
    this.cancelableSnapshots = [];

    // Due to an open issue in Chromium, readableStream.cancel() is never called when a user cancel the stream from Chromium's UI and the stream goes on even it's canceled.
    // Instead, we  monitor the pull() behavior from the readableStream called when the stream wants more data to write.
    // If the stream doesn't pull for long enough time, chances are the stream is already canceled, so we stop the stream.
    // Issue ticket on Chromium: https://bugs.chromium.org/p/chromium/issues/detail?id=638494

    this.iframes = [];

    this.useBlobFallback = false;
  }

  componentDidMount(): void {
    const { getDownloadWorker } = this.props;
    getDownloadWorker()
      .then(sw => {
        log.info('found active service worker');
        this.sw = sw;
        this.sw.postMessage('ping'); // just to activate the service worker
      })
      .catch(error => {
        // if service worker is not available, use blob as fallback to download table csv
        log.warn('Download csv is not optimized.', error);
        this.useBlobFallback = true;
      });
  }

  componentWillUnmount(): void {
    if (this.iframes.length > 0) {
      this.iframes.forEach(iframe => {
        iframe.remove();
      });
    }
    if (this.streamTimeout) clearTimeout(this.streamTimeout);
    if (this.snapshotHandlerTimeout) clearTimeout(this.snapshotHandlerTimeout);
  }

  sw?: ServiceWorker;

  port?: MessagePort;

  fileWriter?: WritableStreamDefaultWriter<unknown>;

  table?: Table;

  tableSubscription?: TableViewportSubscription;

  columns?: readonly Column[];

  fileName?: string;

  includeColumnHeaders: boolean;

  useUnformattedValues: boolean;

  chunkRows?: number;

  gridRanges: readonly GridRange[];

  gridRangeCounter?: number;

  rangedSnapshotsTotal: readonly number[];

  rangedSnapshotCounter?: number;

  snapshotsTotal: number;

  snapshotCounter: number;

  snapshotsBuffer: Map<number, UpdateEventData>;

  currentSnapshotIndex: number;

  snapshotPending: number;

  cancelableSnapshots: (CancelablePromise<unknown> | null)[];

  // Due to an open issue in Chromium, readableStream.cancel() is never called when a user cancel the stream from Chromium's UI and the stream goes on even it's canceled.
  // Instead, we  monitor the pull() behavior from the readableStream called when the stream wants more data to write.
  // If the stream doesn't pull for long enough time, chances are the stream is already canceled, so we stop the stream.
  // Issue ticket on Chromium: https://bugs.chromium.org/p/chromium/issues/detail?id=638494
  streamTimeout?: ReturnType<typeof setTimeout>;

  snapshotHandlerTimeout?: ReturnType<typeof setTimeout>;

  downloadStartTime?: number;

  iframes: HTMLIFrameElement[];

  useBlobFallback: boolean;

  getCachedCustomColumnFormatFlag = memoizeClear(
    FormatterUtils.isCustomColumnFormatDefined,
    { max: 10000 }
  );

  createWriterStream(
    port: MessagePort
  ): WritableStream<{
    rows?: string | undefined;
    header?: string | undefined;
  }> {
    // use blob fall back if it's safari
    const useBlob = this.useBlobFallback;
    const chunks = [] as BlobPart[];
    let encode: ((input?: string) => Uint8Array) | null = null;
    if (useBlob) {
      encode = TextEncoder.prototype.encode.bind(new TextEncoder());
    }
    const { fileName } = this;

    const streamConfig = {} as UnderlyingSink<{
      rows?: string | undefined;
      header?: string | undefined;
    }>;
    if (useBlob) {
      streamConfig.write = (chunk: { rows?: string; header?: string }) => {
        assertNotNull(encode);
        if (chunk.header !== undefined) {
          chunks.push(encode(chunk.header));
        }
        if (chunk.rows !== undefined) {
          chunks.push(encode(chunk.rows));
        }
      };
      streamConfig.close = () => {
        assertNotNull(fileName);
        const blob = new Blob(chunks, {
          type: 'application/octet-stream; charset=utf-8',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
      };
      streamConfig.abort = () => {
        port.postMessage({ cancel: true });
        port.close();
      };
    } else {
      streamConfig.write = (chunk: unknown) => {
        port.postMessage(chunk);
      };
      streamConfig.close = () => {
        port.postMessage({ end: true });
        port.close();
      };
      streamConfig.abort = () => {
        port.postMessage({ cancel: true });
        port.close();
      };
    }

    return new WritableStream(streamConfig);
  }

  startDownload(
    fileName: string,
    frozenTable: Table,
    tableSubscription: TableViewportSubscription,
    snapshotRanges: readonly GridRange[],
    modelRanges: readonly GridRange[],
    includeColumnHeaders: boolean,
    useUnformattedValues: boolean
  ): void {
    // don't trigger another download when a download is ongoing
    const { isDownloading } = this.props;
    if (isDownloading) {
      return;
    }

    this.downloadStartTime = Date.now();
    log.info(`start downloading ${fileName}`);

    this.table = frozenTable;
    this.columns = IrisGridUtils.columnsFromRanges(
      modelRanges,
      frozenTable.columns
    );
    this.tableSubscription = tableSubscription;
    this.gridRanges = snapshotRanges;
    this.includeColumnHeaders = includeColumnHeaders;
    this.useUnformattedValues = useUnformattedValues;

    // Make filename RFC5987 compatible
    const encodedFileName = encodeURIComponent(fileName.replace(/\//g, ':'))
      .replace(/['()]/g, escape)
      .replace(/\*/g, '%2A');

    const messageChannel = new MessageChannel();
    this.port = messageChannel.port1;
    this.fileName = fileName;
    this.fileWriter = this.createWriterStream(this.port).getWriter();

    // if the browser doesn't support stream or there's no active service worker, use blobs for table download
    if (this.useBlobFallback) {
      this.writeCsvTable(includeColumnHeaders);
      return;
    }

    if (this.sw) {
      // send file name and port to service worker
      this.sw.postMessage({ encodedFileName }, [messageChannel.port2]);
    }
    this.port.onmessage = this.handlePortMessage;
  }

  finishDownload(): void {
    if (this.table) {
      this.table.close();
    }
    if (this.tableSubscription) {
      this.tableSubscription.close();
    }
    if (this.fileWriter) {
      this.fileWriter.close();
    }

    const { onDownloadCompleted } = this.props;
    onDownloadCompleted();
    this.resetTableSaver();

    if (this.downloadStartTime !== undefined) {
      log.info(
        `download finished, total elapsed time ${
          (Date.now() - this.downloadStartTime) / 1000
        } seconds`
      );
    }
  }

  cancelDownload(): void {
    if (this.table) {
      this.table.close();
    }
    if (this.tableSubscription) {
      this.tableSubscription.close();
    }
    if (this.fileWriter) {
      this.fileWriter.abort();
    }

    this.cancelableSnapshots.forEach(cancelable => {
      if (cancelable) {
        cancelable.catch(() => null);
        cancelable.cancel();
      }
    });
    const { onDownloadCanceled } = this.props;
    onDownloadCanceled();
    this.resetTableSaver();
  }

  resetTableSaver(): void {
    this.table = undefined;
    this.tableSubscription = undefined;
    this.columns = undefined;
    this.chunkRows = undefined;

    this.gridRanges = [];
    this.gridRangeCounter = 0;
    this.rangedSnapshotsTotal = [];
    this.rangedSnapshotCounter = 0;

    this.includeColumnHeaders = true;
    this.useUnformattedValues = false;

    this.snapshotsTotal = 0;
    this.snapshotCounter = 0;
    this.snapshotsBuffer = new Map();

    this.currentSnapshotIndex = 0;
    this.snapshotPending = 0;
    this.cancelableSnapshots = [];

    if (this.streamTimeout != null) {
      clearTimeout(this.streamTimeout);
    }

    if (this.snapshotHandlerTimeout != null) {
      clearTimeout(this.snapshotHandlerTimeout);
    }
    this.streamTimeout = undefined;
    this.snapshotHandlerTimeout = undefined;
  }

  handleDownloadTimeout(): void {
    log.info('download canceled');
    this.cancelDownload();
  }

  writeTableHeader(): void {
    let headerString = '';
    if (this.columns) {
      for (let i = 0; i < this.columns.length; i += 1) {
        headerString += this.columns[i].name;
        headerString += i === this.columns.length - 1 ? '\n' : ',';
      }
    }
    this.fileWriter?.write({ header: headerString }).then(() => null);
  }

  startWriteTableBody(): void {
    if (this.columns && this.gridRanges != null) {
      this.chunkRows = Math.floor(
        TableSaver.DOWNLOAD_CELL_CHUNK / this.columns.length
      );

      this.rangedSnapshotsTotal = this.gridRanges.map((range: GridRange) => {
        assertNotNull(range.endRow);
        assertNotNull(range.startRow);
        assertNotNull(this.chunkRows);

        return Math.ceil((range.endRow - range.startRow + 1) / this.chunkRows);
      });
      this.snapshotsTotal = this.rangedSnapshotsTotal.reduce(
        (total: number, snapshotCount: number) => total + snapshotCount
      );

      log.info(`start writing table, total snapshots: `, this.snapshotsTotal);

      this.makeSnapshot(
        Math.min(TableSaver.SNAPSHOT_BUFFER_SIZE, this.snapshotsTotal)
      );
    }
  }

  writeCsvTable(includeColumnHeaders: boolean): void {
    if (includeColumnHeaders) {
      this.writeTableHeader();
    }
    this.startWriteTableBody();
  }

  writeSnapshot(
    snapshotIndex: number,
    snapshotStartRow: GridRangeIndex,
    snapshotEndRow: GridRangeIndex
  ): void {
    if (this.currentSnapshotIndex === snapshotIndex && this.fileWriter) {
      while (this.snapshotsBuffer.has(this.currentSnapshotIndex)) {
        const n = this.snapshotsBuffer.get(this.currentSnapshotIndex);
        assertNotNull(n);
        this.fileWriter.write({
          rows: this.convertSnapshotIntoCsv(n),
        });
        this.snapshotsBuffer.delete(this.currentSnapshotIndex);
        this.currentSnapshotIndex += 1;

        this.updateDownloadProgress(snapshotIndex);
      }
      if (
        this.snapshotsTotal &&
        this.currentSnapshotIndex >= this.snapshotsTotal
      ) {
        this.finishDownload();
        return;
      }
    }

    if (
      this.snapshotCounter &&
      this.snapshotsTotal &&
      this.snapshotCounter < this.snapshotsTotal
    ) {
      log.debug2(
        `
        current range index: ${this.gridRangeCounter}, 
        snapshotIndexCounter: ${this.snapshotCounter}, 
        currentRangedSnapshotIndex : ${this.rangedSnapshotCounter}, 
        snapshotpending: ${this.snapshotPending}, 
        buffered ${this.snapshotsBuffer.size}
        making ${Math.min(
          TableSaver.SNAPSHOT_BUFFER_SIZE -
            this.snapshotsBuffer.size -
            this.snapshotPending,
          this.snapshotsTotal - this.snapshotCounter
        )} more snapshots
        `
      );
      this.makeSnapshot(
        Math.min(
          TableSaver.SNAPSHOT_BUFFER_SIZE -
            this.snapshotsBuffer.size -
            this.snapshotPending,
          this.snapshotsTotal - this.snapshotCounter
        )
      );
    }
  }

  updateDownloadProgress(snapshotIndex: GridRangeIndex): void {
    if (
      snapshotIndex != null &&
      this.snapshotsTotal != null &&
      this.downloadStartTime != null
    ) {
      const { onDownloadProgressUpdate } = this.props;
      const downloadProgress = Math.floor(
        (snapshotIndex * 100) / this.snapshotsTotal
      );
      const estimateTime =
        snapshotIndex > 1
          ? Math.floor(
              ((Date.now() - this.downloadStartTime) *
                (this.snapshotsTotal - snapshotIndex)) /
                snapshotIndex /
                1000
            )
          : null;

      onDownloadProgressUpdate(downloadProgress, estimateTime);
    }
  }

  convertSnapshotIntoCsv(snapshot: UpdateEventData): string {
    let csvString = '';
    const snapshotIterator = snapshot.added.iterator();
    const { dh, formatter } = this.props;

    const rows = [];
    while (snapshotIterator.hasNext()) {
      rows.push(snapshotIterator.next().value);
    }

    assertNotNull(this.columns);

    const { useUnformattedValues } = this;
    for (let i = 0; i < rows.length; i += 1) {
      const rowIdx = rows[i];
      for (let j = 0; j < this.columns.length; j += 1) {
        const { type, name } = this.columns[j];
        let cellData = null;
        if (useUnformattedValues) {
          let value = snapshot.getData(rowIdx, this.columns[j]) ?? '';
          if (value !== '' && TableUtils.isDateType(type)) {
            // value is just a long value, we should return the value formatted as a full date string
            value = dh.i18n.DateTimeFormat.format(
              UNFORMATTED_DATE_PATTERN,
              value as number | Date | DateWrapper,
              dh.i18n.TimeZone.getTimeZone(formatter.timeZone)
            );
          }
          cellData = value.toString();
        } else {
          const hasCustomColumnFormat = this.getCachedCustomColumnFormatFlag(
            formatter,
            name,
            type
          );
          let formatOverride = null;
          if (!hasCustomColumnFormat) {
            const cellFormat = snapshot.getFormat(rowIdx, this.columns[j]);
            formatOverride =
              cellFormat?.formatString != null ? cellFormat : null;
          }
          if (formatOverride) {
            cellData = formatter.getFormattedString(
              snapshot.getData(rowIdx, this.columns[j]),
              type,
              name,
              formatOverride
            );
          } else {
            cellData = formatter.getFormattedString(
              snapshot.getData(rowIdx, this.columns[j]),
              type,
              name
            );
          }
        }
        csvString += TableSaver.csvEscapeString(cellData);
        csvString += j === this.columns.length - 1 ? '\n' : ',';
      }
    }

    return csvString;
  }

  makeSnapshot(n: number): void {
    if (n <= 0) {
      return;
    }
    const { dh } = this.props;
    assertNotNull(this.gridRangeCounter);
    let i = 0;
    let currentGridRange = this.gridRanges[this.gridRangeCounter];

    assertNotNull(this.tableSubscription);
    assertNotNull(this.columns);
    while (i < n) {
      assertNotNull(currentGridRange);
      assertNotNull(currentGridRange.startRow);
      assertNotNull(currentGridRange.endRow);
      assertNotNull(this.rangedSnapshotCounter);
      assertNotNull(this.chunkRows);
      const snapshotStartRow =
        currentGridRange.startRow + this.rangedSnapshotCounter * this.chunkRows;
      const snapshotEndRow = Math.min(
        snapshotStartRow + this.chunkRows - 1,
        currentGridRange.endRow
      );

      const snapshotIndex = this.snapshotCounter;
      this.cancelableSnapshots.push(
        PromiseUtils.makeCancelable(
          this.tableSubscription
            .snapshot(
              dh.RangeSet.ofRange(snapshotStartRow, snapshotEndRow),
              this.columns
            )
            .then(snapshot => {
              assertIsUpdateEventData(snapshot);
              this.handleSnapshotResolved(
                snapshot,
                snapshotIndex,
                snapshotStartRow,
                snapshotEndRow
              );

              return snapshotIndex;
            })
            .catch(err => {
              log.error(err);
            }),
          val => {
            log.info(`snapshot ${val} has been canceled`);
          }
        )
      );

      this.rangedSnapshotCounter += 1;
      this.snapshotCounter += 1;
      this.snapshotPending += 1;

      if (
        this.rangedSnapshotCounter >=
        this.rangedSnapshotsTotal[this.gridRangeCounter]
      ) {
        this.gridRangeCounter += 1;
        this.rangedSnapshotCounter = 0;
        currentGridRange = this.gridRanges[this.gridRangeCounter];
      }
      i += 1;
    }
  }

  handlePortMessage({
    data,
  }: MessageEvent<{
    download: unknown;
    readableStreamPulling: unknown;
  }>): void {
    const { download, readableStreamPulling } = data;
    if (this.useBlobFallback) {
      return;
    }
    if (download != null) {
      const { includeColumnHeaders } = this;
      this.makeIframe(`${download}`);
      this.writeCsvTable(includeColumnHeaders);
    }
    if (readableStreamPulling != null) {
      if (!this.useBlobFallback) {
        if (this.streamTimeout != null) {
          clearTimeout(this.streamTimeout);
        }
        this.streamTimeout = setTimeout(
          this.handleDownloadTimeout,
          TableSaver.STREAM_TIMEOUT
        );
      }
    }
  }

  handleSnapshotResolved(
    snapshot: UpdateEventData,
    snapshotIndex: number,
    snapshotStartRow: GridRangeIndex,
    snapshotEndRow: GridRangeIndex
  ): void {
    // use time out to break writeSnapshot into an individual task in browser with timeout, so there's window for the browser to update table in needed.
    this.snapshotHandlerTimeout = setTimeout(() => {
      this.snapshotsBuffer.set(snapshotIndex, snapshot);
      this.snapshotPending -= 1;
      this.writeSnapshot(snapshotIndex, snapshotStartRow, snapshotEndRow);
      this.cancelableSnapshots[snapshotIndex] = null;
    }, TableSaver.SNAPSHOT_HANDLER_TIMEOUT);
  }

  makeIframe(src: string): void {
    // make a return value and make it static method
    const iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.src = `download/${src}`;
    iframe.name = 'iframe';
    document.body.appendChild(iframe);
    this.iframes.push(iframe);
  }

  render(): null {
    return null;
  }
}
