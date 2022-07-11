/* eslint no-console: "off" */
import { ERROR, WARN, INFO, DEBUG, DEBUG2 } from './LoggerLevel';

const silent = () => undefined;

class Logger {
  constructor(name: string | null, level: number | undefined) {
    this.name = name;
    this.prefix = name ? `[${name}]` : ``;

    this.setLogLevel(level);
  }

  name: string | null;

  prefix: string;

  level?: number;

  error?: () => void;

  warn?: () => void;

  log?: () => void;

  info?: () => void;

  debug?: () => void;

  debug2?: () => void;

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
