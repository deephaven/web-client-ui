import Log from './Log';
import type Logger from './Logger';
import LogHistory from './LogHistory';
import LogProxy from './LogProxy';

declare global {
  interface Window {
    DHLogHistory?: LogHistory;
    DHLogProxy?: LogProxy;
    DHLog?: Logger;
  }
}

export const logProxy = new LogProxy();
export const logHistory = new LogHistory(logProxy);

export function logInit(logLevel = 2, enableProxy = true): void {
  Log.setLogLevel(logLevel);

  if (enableProxy) {
    logProxy.enable();
    logHistory.enable();
  }

  if (window != null) {
    // Expose the default logger so that log level can be changed dynamically
    window.DHLog = Log;
    window.DHLogProxy = logProxy;
    window.DHLogHistory = logHistory;
  }
}

export default logInit;
