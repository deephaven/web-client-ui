import { TestUtils } from '@deephaven/utils';
import {
  makeMessage,
  makeResponse,
  Message,
  requestParentResponse,
} from './MessageUtils';

it('Throws an exception if called on a window without parent', async () => {
  await expect(requestParentResponse('request')).rejects.toThrow(
    'window parent is null, unable to send request.'
  );
});

/**
 * Set up the mock for window.parent or window.opener, and return a cleanup function.
 * @param type Whether to mock window.parent or window.opener
 * @param mockPostMessage The mock postMessage function to use
 * @returns Cleanup function
 */
function setupWindowParentMock(
  type: string,
  mockPostMessage: jest.Mock
): () => void {
  if (type !== 'parent' && type !== 'opener') {
    throw new Error(`Invalid type ${type}`);
  }
  if (type === 'parent') {
    const windowParentSpy = jest.spyOn(window, 'parent', 'get').mockReturnValue(
      TestUtils.createMockProxy<Window>({
        postMessage: mockPostMessage,
      })
    );
    return () => {
      windowParentSpy.mockRestore();
    };
  }

  const originalWindowOpener = window.opener;
  window.opener = { postMessage: mockPostMessage };
  return () => {
    window.opener = originalWindowOpener;
  };
}

describe.each([['parent'], ['opener']])(
  `requestParentResponse with %s`,
  type => {
    let parentCleanup: () => void;
    let addListenerSpy: jest.SpyInstance;
    let removeListenerSpy: jest.SpyInstance;
    let listenerCallback;
    let messageId;
    const mockPostMessage = jest.fn((data: Message<unknown>) => {
      messageId = data.id;
    });
    beforeEach(() => {
      addListenerSpy = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation((event, cb) => {
          listenerCallback = cb;
        });
      removeListenerSpy = jest.spyOn(window, 'removeEventListener');
      parentCleanup = setupWindowParentMock(type, mockPostMessage);
    });
    afterEach(() => {
      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
      mockPostMessage.mockClear();
      parentCleanup();
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
      expect(removeListenerSpy).toHaveBeenCalledWith(
        'message',
        listenerCallback
      );
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
  }
);
