/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */

class EventHub {
  listeners = [];

  on = jest.fn((name, callback) => {
    this.listeners.push({ name, callback });
  });

  off = jest.fn((name, callback) => {
    this.listeners = this.listeners.filter(
      listener => listener.name !== name || listener.callback !== callback
    );
  });

  emit = jest.fn((name, ...args) => {
    this.listeners.forEach(listener => {
      if (listener.name === name) {
        listener.callback(...args);
      }
    });
  });
}

class LayoutRoot extends EventHub {
  addChild = jest.fn();

  removeChild = jest.fn();

  contentItems = [];
}

export class GoldenLayout extends EventHub {
  destroy = jest.fn();

  init = jest.fn(() => {
    this.listeners.forEach(({ name, callback }) => {
      if (name === 'initialised') {
        callback();
      }
    });
  });

  eventHub = new EventHub();

  root = new LayoutRoot();

  registerComponent = jest.fn(() => () => undefined);

  setFallbackComponent = jest.fn();
}

export default GoldenLayout;
