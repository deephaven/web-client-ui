import { TimeoutError } from '@deephaven/utils';
import { makeMessage, requestParentResponse } from './MessageUtils';

// describe('Throws exception if called on a window without parent', async () => {
//   expect(await requestParentResponse<string>('request', 'response')).toThrow();
// });

jest.useFakeTimers();

describe('requestParentResponse', () => {
  const mockPostMessage = jest.fn();
  let addListenerSpy: jest.SpyInstance;
  let removeListenerSpy: jest.SpyInstance;
  let listenerCallback;
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
  });

  it('Posts message to parent and subscribes to response', async () => {
    requestParentResponse<string>('request', 'response');
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'request' }),
      '*'
    );
    expect(addListenerSpy).toHaveBeenCalledWith(
      'message',
      expect.any(Function)
    );
  });

  it('Resolves with the payload from the parent window response and unsubscribes', async () => {
    const PAYLOAD = 'PAYLOAD';
    const promise = requestParentResponse<string>('request', 'response');
    listenerCallback({
      data: makeMessage<string>('response', PAYLOAD),
    });
    const result = await promise;
    expect(result).toBe(PAYLOAD);
    expect(removeListenerSpy).toHaveBeenCalledWith('message', listenerCallback);
  });

  it('Rejects on time out', async () => {
    const promise = requestParentResponse<string>('request', 'response');
    expect(removeListenerSpy).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(removeListenerSpy).toHaveBeenCalled();
    await expect(promise).rejects.toThrow(TimeoutError);
  });

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
