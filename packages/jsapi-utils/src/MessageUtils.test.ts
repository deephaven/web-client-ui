import { TimeoutError } from '@deephaven/utils';
import { makeMessage, requestParentResponse } from './MessageUtils';

// describe('Throws exception if called on a window without parent', async () => {
//   expect(await requestParentResponse<string>('request', 'response')).toThrow();
// });

jest.useFakeTimers();

describe('requestParentResponse', () => {
  let messageId;
  const mockPostMessage = jest.fn(({ id }) => {
    messageId = id;
  });
  let addListenerSpy: jest.SpyInstance;
  let removeListenerSpy: jest.SpyInstance;
  let listenerCallback;

  beforeEach(() => {
    addListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, cb) => {
        listenerCallback = cb;
      });
    messageId = undefined;
    removeListenerSpy = jest.spyOn(window, 'removeEventListener');
  });
  afterEach(() => {
    addListenerSpy.mockRestore();
    removeListenerSpy.mockRestore();
    mockPostMessage.mockClear();
  });

  it('Posts message to parent and subscribes to response', async () => {
    window.opener = { postMessage: mockPostMessage };
    requestParentResponse<string>('request', 'response');
    expect(mockPostMessage).toBeCalledWith(
      expect.objectContaining({ message: 'request', id: expect.any(String) }),
      '*'
    );
    expect(addListenerSpy).toBeCalledWith('message', expect.any(Function));
  });

  it('Resolves with the payload from the parent window response and unsubscribes', async () => {
    window.opener = { postMessage: mockPostMessage };
    const PAYLOAD = 'PAYLOAD';
    const promise = requestParentResponse<string>('request', 'response');
    listenerCallback({
      data: makeMessage<string>('response', messageId, PAYLOAD),
    });
    const result = await promise;
    expect(result).toBe(PAYLOAD);
    expect(removeListenerSpy).toBeCalledWith('message', listenerCallback);
  });

  // it('Rejects on time out', async () => {
  //   window.opener = { postMessage: mockPostMessage };
  //   const promise = requestParentResponse<string>('request', 'response', 10000);
  //   jest.runOnlyPendingTimers();
  //   expect(await promise).rejects.toMatch('Request timed out');
  // });

  // it('Ignores unrelated messages', async () => {
  //   window.opener = { postMessage: mockPostMessage };
  //   const PAYLOAD = 'PAYLOAD';
  //   const promise = requestParentResponse<string>('request', 'response');
  //   listenerCallback({
  //     data: makeMessage<string>('response', `TEST_${messageId}`, PAYLOAD),
  //   });
  //   const result = await promise;
  //   expect(result).toBe(PAYLOAD);
  // });
});
