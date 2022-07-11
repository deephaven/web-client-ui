import Logger from './Logger';
import LoggerLevel, { DEBUG2, INFO, SILENT } from './LoggerLevel';

/**
 * Get the default log level to use.
 * production mode defaults to INFO.
 * development mode defaults to DEBUG2 (most verbose).
 * test mode defaults to SILENT.
 * Override by setting environment variable `process.env.DEEPHAVEN_LOG_LEVEL`
 * @returns The default log level to use
 */
function getDefaultLevel(): number {
  let envValue: string | undefined = '';
  try {
    envValue = process.env.DEEPHAVEN_LOG_LEVEL;
  } catch {
    // no-op. Environment without process defined
  }
  if (envValue && LoggerLevel[envValue]) {
    return LoggerLevel[envValue];
  }
  const envLevel = parseInt(envValue ?? '', 10);
  if (!Number.isNaN(envLevel)) {
    return envLevel;
  }

  try {
    if (process.env.NODE_ENV === 'test') {
      return SILENT;
    }
    if (process.env.NODE_ENV === 'development') {
      return DEBUG2;
    }
  } catch {
    // no-op. Environment without process defined
  }

  return INFO;
}

class DefaultLogger extends Logger {
  constructor(level = getDefaultLevel()) {
    super(null, level);

    this.modules = {};
  }

  modules: Record<string, Logger>;

  module(name: string): Logger {
    if (!this.modules[name]) {
      this.modules[name] = new Logger(name, this.level);
    }

    return this.modules[name];
  }

  setLogLevel(level: number | undefined): void {
    super.setLogLevel(level);

    if (!this.modules) {
      return;
    }

    const keys = Object.keys(this.modules);
    for (let i = 0; i < keys.length; i += 1) {
      this.modules[keys[i]].setLogLevel(level);
    }
  }
}

export default DefaultLogger;
