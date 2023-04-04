import {
  makeMessage,
  makeResponse,
  Message,
  requestParentResponse,
} from './MessageUtils';

it('Throws an exception if called on a window without parent', async () => {
  await expect(requestParentResponse('request')).rejects.toThrow(
    'window.opener is null, unable to send request.'
  );
});

describe('requestParentResponse', () => {
  let addListenerSpy: jest.SpyInstance;
  let removeListenerSpy: jest.SpyInstance;
  let listenerCallback;
  let messageId;
  const mockPostMessage = jest.fn((data: Message<unknown>) => {
    messageId = data.id;
  });
  const originalWindowOpener = window.opener;
  beforeEach(() => {
    addListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, cb) => {
        listenerCallback = cb;
      });
    removeListenerSpy = jest.spyOn(window, 'removeEventListener');
    window.opener = { postMessage: mockPostMessage };
  });
  afterEach(() => {
    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
    mockPostMessage.mockClear();
    window.opener = originalWindowOpener;
    messageId = undefined;
  });

  it('Posts message to parent and subscribes to response', async () => {
    requestParentResponse('request');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining(makeMessage('request', messageId)),
      '*'
    );
    expect(addListenerSpy).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
  });

  it('Resolves with the payload from the parent window response and unsubscribes', async () => {
    const PAYLOAD = 'PAYLOAD';
    const promise = requestParentResponse('request');
    listenerCallback({
      data: makeResponse(messageId, PAYLOAD),
    });
    const result = await promise;
    expect(result).toBe(PAYLOAD);
    expect(removeListenerSpy).toHaveBeenCalledWith('message', listenerCallback);
  });

  it('Ignores unrelated response, rejects on timeout', async () => {
    jest.useFakeTimers();
    const promise = requestParentResponse('request');
    listenerCallback({
      data: makeMessage('wrong-id'),
    });
    jest.runOnlyPendingTimers();
    await expect(promise).rejects.toThrow('Request timed out');
    jest.useRealTimers();
  });

  it('Times out if no response', async () => {
    jest.useFakeTimers();
    const promise = requestParentResponse('request');
    jest.runOnlyPendingTimers();
    expect(removeListenerSpy).toHaveBeenCalled();
    await expect(promise).rejects.toThrow('Request timed out');
    jest.useRealTimers();
  });
});
