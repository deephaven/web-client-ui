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

export const logProxy = new LogProxy();
export const logHistory = new LogHistory(logProxy);

let logIndexedDbHistory: LogIndexedDbHistory | null = null;

/** Null until logInit runs, and when the proxy is disabled. */
export function getLogIndexedDbHistory(): LogIndexedDbHistory | null {
  return logIndexedDbHistory;
}

export function logInit(
  logLevel = 2,
  enableProxy = true,
  options: LogIndexedDbHistoryOptions = {}
): void {
  Log.setLogLevel(logLevel);

  if (enableProxy) {
    logProxy.enable();
    logHistory.enable();

    // Persistence reads the proxy's events, so it is unavailable without it.
    // Reused so repeat calls don't subscribe a second sink.
    if (logIndexedDbHistory == null) {
      logIndexedDbHistory = new LogIndexedDbHistory(logProxy, options);
    }
    logIndexedDbHistory.enable();
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
