import Log from './Log';
import type Logger from './Logger';
import LogHistory from './LogHistory';
import LogIndexedDbHistory, {
  type LogIndexedDbHistoryOptions,
} from './LogIndexedDbHistory';
import LogProxy from './LogProxy';

declare global {
  interface Window {
    DHLogHistory?: LogHistory;
    DHLogIndexedDbHistory?: LogIndexedDbHistory;
    DHLogProxy?: LogProxy;
    DHLog?: Logger;
  }
}

export type LogInitOptions = LogIndexedDbHistoryOptions & {
  /** Persist logs to IndexedDB so they survive a reload. Off by default. */
  persist?: boolean;
};

export const logProxy = new LogProxy();
export const logHistory = new LogHistory(logProxy);

let logIndexedDbHistory: LogIndexedDbHistory | null = null;

/** Null unless log persistence was enabled via logInit. */
export function getLogIndexedDbHistory(): LogIndexedDbHistory | null {
  return logIndexedDbHistory;
}

export function logInit(
  logLevel = 2,
  enableProxy = true,
  options: LogInitOptions = {}
): void {
  Log.setLogLevel(logLevel);

  const { persist = false, ...persistenceOptions } = options;

  if (enableProxy) {
    logProxy.enable();
    logHistory.enable();

    // Persistence reads the proxy's events, so it is unavailable without it
    if (persist) {
      logIndexedDbHistory = new LogIndexedDbHistory(
        logProxy,
        persistenceOptions
      );
      logIndexedDbHistory.enable();
    }
  }

  if (window != null) {
    // Expose the default logger so that log level can be changed dynamically
    window.DHLog = Log;
    window.DHLogProxy = logProxy;
    window.DHLogHistory = logHistory;
    window.DHLogIndexedDbHistory = logIndexedDbHistory ?? undefined;
  }
}

export default logInit;
