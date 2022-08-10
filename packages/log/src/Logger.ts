/* eslint no-console: "off" */
import { ERROR, WARN, INFO, DEBUG, DEBUG2 } from './LoggerLevel';

const silent = () => undefined;

class Logger {
  constructor(name: string | null, level: number) {
    this.name = name;
    this.prefix = name ? `[${name}]` : ``;

    this.error = silent;
    this.warn = silent;
    this.log = silent;
    this.info = silent;
    this.debug = silent;
    this.debug2 = silent;
    this.level = level;

    this.setLogLevel(level);
  }

  name: string | null;

  prefix: string;

  level: number;

  error: (...data: unknown[]) => void;

  warn: (...data: unknown[]) => void;

  log: (...data: unknown[]) => void;

  info: (...data: unknown[]) => void;

  debug: (...data: unknown[]) => void;

  debug2: (...data: unknown[]) => void;

  setLogLevel(level: number): void {
    if (!Number.isFinite(level)) {
      console.warn(
        `Expected a number for log level. Received: ${level}. Ignoring`
      );
      return;
    }
    this.level = level;

    this.error =
      level >= ERROR ? console.error.bind(console, this.prefix) : silent;
    this.warn =
      level >= WARN ? console.warn.bind(console, this.prefix) : silent;
    this.log = level >= INFO ? console.log.bind(console, this.prefix) : silent;
    this.info = this.log;
    this.debug =
      level >= DEBUG ? console.debug.bind(console, this.prefix) : silent;
    this.debug2 =
      level >= DEBUG2 ? console.debug.bind(console, this.prefix) : silent;
  }
}

export default Logger;
