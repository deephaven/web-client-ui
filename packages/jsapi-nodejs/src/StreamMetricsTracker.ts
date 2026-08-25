import { performance } from 'node:perf_hooks';

export interface NodeHttp2StreamMetrics {
  origin: string;
  /** gRPC method path, e.g. `/<package>.<Service>/<method>`. */
  path: string;
  event: 'interval' | 'end';
  durationMs: number;
  /** Absent when the stream ended without ever delivering a chunk. */
  timeToFirstChunkMs?: number;
  chunkCount: number;
  byteCount: number;
  maxChunkBytes: number;
  bytesPerSecond: number;
  /**
   * Wall-clock spent handing chunks to the JS API. A small ratio to
   * `durationMs` means the transport is waiting on the wire, a large one means
   * the consumer is the bottleneck.
   */
  consumerTimeMs: number;
}

export interface StreamMetricsTrackerOptions {
  origin: string;
  path: string;
  /** Wrapped so the time it takes can be charged to `consumerTimeMs`. */
  onChunk: (chunk: Uint8Array) => void;
  onMetrics: (metrics: NodeHttp2StreamMetrics) => void;
  /** Emit an `'interval'` event this often while the stream is open. */
  intervalMs?: number;
}

/** Accounting for a single in-flight stream. */
export class StreamMetricsTracker {
  constructor({
    origin,
    path,
    onChunk,
    onMetrics,
    intervalMs,
  }: StreamMetricsTrackerOptions) {
    this.origin = origin;
    this.path = path;
    this.onChunk = onChunk;
    this.onMetrics = onMetrics;
    this.startTime = performance.now();

    if (intervalMs != null) {
      const intervalId = setInterval(() => this.emit('interval'), intervalMs);
      // Otherwise the timer holds the event loop open and consumers hang on exit.
      intervalId.unref?.();
      this.intervalId = intervalId;
    }
  }

  private readonly origin: string;

  private readonly path: string;

  private readonly onChunk: (chunk: Uint8Array) => void;

  private readonly onMetrics: (metrics: NodeHttp2StreamMetrics) => void;

  private readonly startTime: number;

  private intervalId: ReturnType<typeof setInterval> | undefined;

  private firstChunkTime: number | undefined;

  private chunkCount = 0;

  private byteCount = 0;

  private maxChunkBytes = 0;

  private consumerTimeMs = 0;

  private isEnded = false;

  /** Hand `chunk` to the consumer, timing how long it takes to accept it. */
  recordChunk(chunk: Uint8Array): void {
    const now = performance.now();

    this.firstChunkTime ??= now;
    this.chunkCount += 1;
    this.byteCount += chunk.length;
    this.maxChunkBytes = Math.max(this.maxChunkBytes, chunk.length);

    try {
      this.onChunk(chunk);
    } finally {
      this.consumerTimeMs += performance.now() - now;
    }
  }

  /** Emit a final `'end'` event and stop the interval. Idempotent. */
  finish(): void {
    if (this.isEnded) {
      return;
    }
    this.isEnded = true;

    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    this.emit('end');
  }

  private emit(event: NodeHttp2StreamMetrics['event']): void {
    const durationMs = performance.now() - this.startTime;

    this.onMetrics({
      origin: this.origin,
      path: this.path,
      event,
      durationMs,
      ...(this.firstChunkTime == null
        ? {}
        : { timeToFirstChunkMs: this.firstChunkTime - this.startTime }),
      chunkCount: this.chunkCount,
      byteCount: this.byteCount,
      maxChunkBytes: this.maxChunkBytes,
      bytesPerSecond: durationMs > 0 ? (this.byteCount * 1000) / durationMs : 0,
      consumerTimeMs: this.consumerTimeMs,
    });
  }
}
