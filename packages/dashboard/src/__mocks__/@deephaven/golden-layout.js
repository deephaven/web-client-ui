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
}

class LayoutRoot {
  addChild = jest.fn();

  removeChild = jest.fn();
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

  // root = new LayoutRoot();
}

export default GoldenLayout;
