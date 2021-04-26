import Logger from './Logger';
import { INFO } from './LoggerLevel';

class DefaultLogger extends Logger {
  constructor(level = INFO) {
    super(null, level);

    this.modules = {};
  }

  module(name) {
    if (!this.modules[name]) {
      this.modules[name] = new Logger(name, this.level);
    }

    return this.modules[name];
  }

  setLogLevel(level) {
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
