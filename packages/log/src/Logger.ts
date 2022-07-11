/* eslint no-console: "off" */
import { ERROR, WARN, INFO, DEBUG, DEBUG2 } from './LoggerLevel';

const silent = () => undefined;

class Logger {
  constructor(name: string | null, level: number | undefined) {
    this.name = name;
    this.prefix = name ? `[${name}]` : ``;

    this.error = silent;
    this.warn = silent;
    this.log = silent;
    this.info = silent;
    this.debug = silent;
    this.debug2 = silent;

    this.setLogLevel(level);
  }

  name: string | null;

  prefix: string;

  level?: number;

  error: (...data: unknown[]) => void;

  warn: (...data: unknown[]) => void;

  log: (...data: unknown[]) => void;

  info: (...data: unknown[]) => void;

  debug: (...data: unknown[]) => void;

  debug2: (...data: unknown[]) => void;

  setLogLevel(level?: number): void {
    this.level = level;

    this.error =
      level != null && ERROR <= level
        ? console.error.bind(console, this.prefix)
        : silent;
    this.warn =
      level != null && WARN <= level
        ? console.warn.bind(console, this.prefix)
        : silent;
    this.log =
      level != null && INFO <= level
        ? console.log.bind(console, this.prefix)
        : silent;
    this.info = this.log;
    this.debug =
      level != null && DEBUG <= level
        ? console.debug.bind(console, this.prefix)
        : silent;
    this.debug2 =
      level != null && DEBUG2 <= level
        ? console.debug.bind(console, this.prefix)
        : silent;
  }
}

export default Logger;
