import EventEmitter from './EventEmitter';
import {
  listenForEvent,
  makeListenFunction,
  makeEmitFunction,
} from './EventUtils';

describe('EventUtils', () => {
  const eventEmitter = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  } as unknown as EventEmitter;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listenForEvent', () => {
    const event = 'test';
    const handler = jest.fn();
    const remove = listenForEvent(eventEmitter, event, handler);
    expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
    remove();
    expect(eventEmitter.off).toHaveBeenCalledWith(event, handler);
  });

  it('makeListenFunction', () => {
    const event = 'test';
    const listen = makeListenFunction(event);
    const handler = jest.fn();
    listen(eventEmitter, handler);
    expect(eventEmitter.on).toHaveBeenCalledWith(event, handler);
  });

  it('makeEmitFunction', () => {
    const event = 'test';
    const emit = makeEmitFunction(event);
    const payload = { test: 'test' };
    emit(eventEmitter, payload);
    expect(eventEmitter.emit).toHaveBeenCalledWith(event, payload);
  });
});
