/* eslint no-console: "off" */
import { ERROR, WARN, INFO, DEBUG, DEBUG2 } from './LoggerLevel';

const silent = () => {};

class Logger {
  constructor(name, level) {
    this.name = name;
    this.prefix = name ? `[${name}]` : ``;

    this.setLogLevel(level);
  }

  setLogLevel(level) {
    this.level = level;

    this.error =
      ERROR <= level ? console.error.bind(console, this.prefix) : silent;
    this.warn =
      WARN <= level ? console.warn.bind(console, this.prefix) : silent;
    this.log = INFO <= level ? console.log.bind(console, this.prefix) : silent;
    this.info = this.log;
    this.debug =
      DEBUG <= level ? console.debug.bind(console, this.prefix) : silent;
    this.debug2 =
      DEBUG2 <= level ? console.debug.bind(console, this.prefix) : silent;
  }
}

export default Logger;
