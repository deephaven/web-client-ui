import { LogProxy, LOG_PROXY_TYPE } from './LogProxy';

type HistoryItem = {
  type: LOG_PROXY_TYPE;
  messages: unknown[];
  time: Date;
  stack?: string;
};

class LogHistory {
  private history: HistoryItem[];

  private offset: number;

  private limit: number;

  private isEnabled: boolean;

  private proxy: LogProxy;

  /**
   * Formats log arguments on separate lines
   * Attempts to stringify objects
   * @param messages - The messages/params sent to the log call
   */
  static formatMessages(messages: unknown[]): string {
    const formatted = messages.map(m => {
      if (typeof m === 'string') {
        return m;
      }

      // Some objects don't stringify nicely, so give some info about the object
      let jsonString = '';
      try {
        jsonString = JSON.stringify(m);
      } catch (e) {
        jsonString = (m as Record<string, unknown>).toString();
      }
      return jsonString === '{}'
        ? (m as Record<string, unknown>).toString()
        : jsonString;
    });

    return formatted.join('\t');
  }

  /**
   * Formats stack traces to a string with each frame on its own line and indented 1 level
   * @param stack - Stack trace generated in the console
   * @param type - Log type (e.g. log, warn, error)
   */
  static formatStack(stack = '', type: LOG_PROXY_TYPE): string {
    if (stack === '') {
      return '';
    }

    // Some browsers will add a top frame which is just 'Error', some won't
    // We will always add at least 2 frames. 1 creating the error and 1 calling addHistory
    // On error (logger.error) we add a 3rd frame which is overriding console.error
    // For uncaught errors the 3rd frame is not added
    let stringStack = stack.split('\n').map(line => line.trim());
    switch (type) {
      case LOG_PROXY_TYPE.ERROR:
        stringStack = stringStack.splice(stack[0] === 'Error' ? 4 : 3);
        break;
      case LOG_PROXY_TYPE.UNCAUGHT_ERROR:
        stringStack = stringStack.splice(stack[0] === 'Error' ? 3 : 2);
        break;
      default:
        break;
    }
    return stringStack ? `\t${stringStack.join('\n\t')}` : '';
  }

  constructor(proxy: LogProxy) {
    this.history = [];
    this.offset = 0;
    this.limit = 10000;
    this.isEnabled = false;
    this.proxy = proxy;

    this.addHistory = this.addHistory.bind(this);
  }

  enable(): void {
    if (this.isEnabled) {
      return;
    }

    this.proxy.addEventListener(LOG_PROXY_TYPE.DEBUG, this.addHistory);
    this.proxy.addEventListener(LOG_PROXY_TYPE.LOG, this.addHistory);
    this.proxy.addEventListener(LOG_PROXY_TYPE.WARN, this.addHistory);
    this.proxy.addEventListener(LOG_PROXY_TYPE.ERROR, this.addHistory);
    this.proxy.addEventListener(LOG_PROXY_TYPE.UNCAUGHT_ERROR, this.addHistory);
    this.isEnabled = true;
  }

  disable(): void {
    if (!this.isEnabled) {
      return;
    }

    this.proxy.removeEventListener(LOG_PROXY_TYPE.DEBUG, this.addHistory);
    this.proxy.removeEventListener(LOG_PROXY_TYPE.LOG, this.addHistory);
    this.proxy.removeEventListener(LOG_PROXY_TYPE.WARN, this.addHistory);
    this.proxy.removeEventListener(LOG_PROXY_TYPE.ERROR, this.addHistory);
    this.proxy.removeEventListener(
      LOG_PROXY_TYPE.UNCAUGHT_ERROR,
      this.addHistory
    );
    this.isEnabled = false;
  }

  /**
   * Adds a call to a console method to the history.
   * @param type - The level of the message to add
   * @param messages - The parameters passed to the console method
   */
  addHistory({ type, detail }: CustomEvent<unknown[]>): void {
    const logItem: HistoryItem = {
      type: type as LOG_PROXY_TYPE,
      messages: detail,
      time: new Date(),
    };

    switch (type) {
      // Some browsers will add a top frame which is just 'Error', some won't
      // We will always add at least 2 frames. 1 creating the error and 1 calling addHistory
      // On error (logger.error) we add a 3rd frame which is overriding console.error
      // For uncaught errors the 3rd frame is not added
      case LOG_PROXY_TYPE.ERROR:
      case LOG_PROXY_TYPE.UNCAUGHT_ERROR:
        logItem.stack = Error().stack;
        break;
      default:
        break;
    }

    this.history[this.offset % this.limit] = logItem;
    this.offset += 1;
  }

  /**
   * Gets LogHistory object
   */
  getHistory(): HistoryItem[] {
    if (this.offset > this.limit) {
      // Wrapped past the limit, get oldest -> end and concat start -> newest
      const startIdx = this.offset % this.limit;
      this.history = this.history
        .slice(startIdx)
        .concat(this.history.slice(0, startIdx));
      this.offset = this.limit;
    }
    return this.history;
  }

  /**
   * Gets the history formatted as a string so it can easily be exported to a txt file
   */
  getFormattedHistory(): string {
    const historyString = this.getHistory().map(
      item =>
        // eslint-disable-next-line prefer-template
        `${item.time.toISOString()} ${item.type}\t` +
        `${LogHistory.formatMessages(item.messages)}` +
        (item.stack ? `\n${LogHistory.formatStack(item.stack, item.type)}` : '')
    );

    return historyString.join('\n');
  }
}

export default LogHistory;
