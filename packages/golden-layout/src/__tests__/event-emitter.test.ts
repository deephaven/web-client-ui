import EventEmitter from '../utils/EventEmitter';

describe('the EventEmitter works', () => {
  const createEmitter = () => new EventEmitter();

  it('is possible to inherit from EventEmitter', () => {
    const myObject = createEmitter();
    expect(typeof myObject.on).toBe('function');
    expect(typeof myObject.unbind).toBe('function');
    expect(typeof myObject.trigger).toBe('function');
  });

  it('notifies callbacks', () => {
    const myObject = createEmitter();
    const callback = jest.fn();

    expect(callback).not.toHaveBeenCalled();
    myObject.on('someEvent', callback);
    expect(callback).not.toHaveBeenCalled();
    myObject.emit('someEvent', 'Good', 'Morning');
    expect(callback).toHaveBeenCalledWith('Good', 'Morning');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("triggers an 'all' event", () => {
    const myObject = createEmitter();
    const callback = jest.fn();
    const allCallback = jest.fn();

    myObject.on('someEvent', callback);
    myObject.on(EventEmitter.ALL_EVENT, allCallback);

    expect(callback).not.toHaveBeenCalled();
    expect(allCallback).not.toHaveBeenCalled();

    myObject.emit('someEvent', 'Good', 'Morning');
    expect(callback).toHaveBeenCalledWith('Good', 'Morning');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(allCallback).toHaveBeenCalledWith('someEvent', 'Good', 'Morning');
    expect(allCallback).toHaveBeenCalledTimes(1);

    myObject.emit('someOtherEvent', 123);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(allCallback).toHaveBeenCalledWith('someOtherEvent', 123);
    expect(allCallback).toHaveBeenCalledTimes(2);
  });

  it('triggers sets the right context', () => {
    const myObject = createEmitter();
    let context: { some: string } | null = null;
    const callback = function (this: { some: string }) {
      context = this;
    };

    myObject.on('someEvent', callback, { some: 'thing' });
    expect(context).toBe(null);
    myObject.emit('someEvent');
    expect(context!.some).toBe('thing');
  });

  it('unbinds events', () => {
    const myObject = createEmitter();
    const callback = jest.fn();

    myObject.on('someEvent', callback);
    expect(callback).toHaveBeenCalledTimes(0);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(1);
    myObject.unbind('someEvent', callback);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('unbinds all events if no context is provided', () => {
    const myObject = createEmitter();
    const callback = jest.fn();

    myObject.on('someEvent', callback);
    expect(callback).toHaveBeenCalledTimes(0);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(1);
    myObject.unbind('someEvent');
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('unbinds events for a specific context only', () => {
    const myObject = createEmitter();
    const callback = jest.fn();
    const contextA = { name: 'a' };
    const contextB = { name: 'b' };

    myObject.on('someEvent', callback, contextA);
    myObject.on('someEvent', callback, contextB);
    expect(callback).toHaveBeenCalledTimes(0);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(2);
    myObject.unbind('someEvent', callback, contextA);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(3);
    myObject.unbind('someEvent', callback, contextB);
    myObject.emit('someEvent');
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('throws an exception when trying to unsubscribe for a non existing method', () => {
    const myObject = createEmitter();
    const callback = jest.fn();

    myObject.on('someEvent', callback);

    expect(() => {
      myObject.unbind('someEvent', () => {});
    }).toThrow();

    expect(() => {
      myObject.unbind('doesNotExist', callback);
    }).toThrow();

    expect(() => {
      myObject.unbind('someEvent', callback);
    }).not.toThrow();
  });

  it('throws an exception when attempting to bind a non-function', () => {
    const myObject = createEmitter();

    expect(() => {
      myObject.on('someEvent', 1 as unknown as Function);
    }).toThrow();

    expect(() => {
      myObject.on('someEvent', undefined as unknown as Function);
    }).toThrow();

    expect(() => {
      myObject.on('someEvent', {} as unknown as Function);
    }).toThrow();
  });
});
