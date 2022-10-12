import Logger from './Logger';
import { INFO } from './LoggerLevel';

class DefaultLogger extends Logger {
  constructor(level = INFO) {
    super(null, level);

    this.modules = {};
  }

  modules: Record<string, Logger>;

  module(name: string): Logger {
    if (this.modules[name] == null) {
      this.modules[name] = new Logger(name, this.level);
    }

    return this.modules[name];
  }

  setLogLevel(level: number): void {
    super.setLogLevel(level);

    if (this.modules == null) {
      return;
    }

    const keys = Object.keys(this.modules);
    for (let i = 0; i < keys.length; i += 1) {
      this.modules[keys[i]].setLogLevel(level);
    }
  }
}

export default DefaultLogger;
