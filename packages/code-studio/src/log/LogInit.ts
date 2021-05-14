import { LogProxy, LogHistory, Logger, Log } from '@deephaven/log';

declare global {
  interface Window {
    DHLogHistory?: LogHistory;
    DHLogProxy?: LogProxy;
    DHLog?: Logger;
  }
}

export const logProxy = new LogProxy();
export const logHistory = new LogHistory(logProxy);

export default function logInit(): void {
  if (process.env.REACT_APP_ENABLE_LOG_PROXY === 'true') {
    logProxy.enable();
    logHistory.enable();
  }

  if (process.env.NODE_ENV === 'development' && window) {
    // In development environment, expose the default logger so that log level can be changed dynamically
    window.DHLog = Log;
    window.DHLogProxy = logProxy;
    window.DHLogHistory = logHistory;
  }
}
