import { nanoid } from 'nanoid';
import { TestUtils } from '@deephaven/test-utils';
import {
  getWindowParent,
  isMessage,
  isResponse,
  makeMessage,
  makeResponse,
  requestParentResponse,
  sendMessageToParent,
  type PostMessage,
} from './MessageUtils';

jest.mock('nanoid');
const { asMock } = TestUtils;

let nanoIdCount = 0;
function mockNanoId(i: number): string {
  return `mock.nanoid.${i}`;
}

beforeEach(() => {
  jest.clearAllMocks();

  asMock(nanoid).mockImplementation(() => {
    nanoIdCount += 1;
    return mockNanoId(nanoIdCount);
  });
});

let afterEachCallback: (() => void) | null = null;

afterEach(() => {
  afterEachCallback?.();
  afterEachCallback = null;
});

/**
 * Set up the mock for window.parent or window.opener, and return a cleanup function.
 * @param type Whether to mock window.parent or window.opener
 * @param mockPostMessage The mock postMessage function to use
 * @returns Cleanup function
 */
function setupWindowParentMock(
  type: 'parent' | 'opener',
  mockPostMessage: jest.Mock = jest.fn(),
  mockWindow?: Window
): () => void {
  if (type !== 'parent' && type !== 'opener') {
    throw new Error(`Invalid type ${type}`);
  }

  if (type === 'parent') {
    const windowParentSpy = jest.spyOn(window, 'parent', 'get').mockReturnValue(
      mockWindow ??
        TestUtils.createMockProxy<Window>({
          postMessage: mockPostMessage,
        })
    );
    return () => {
      windowParentSpy.mockRestore();
    };
  }

  const originalWindowOpener = window.opener;
  window.opener = mockWindow ?? { postMessage: mockPostMessage };
  return () => {
    window.opener = originalWindowOpener;
  };
}

describe('getWindowParent', () => {
  it('should return window.opener if available', () => {
    afterEachCallback = setupWindowParentMock('opener');
    expect(getWindowParent()).toBe(window.opener);
  });

  describe('no opener', () => {
    it('should return window.parent if available', () => {
      afterEachCallback = setupWindowParentMock('parent');
      expect(getWindowParent()).toBe(window.parent);
    });

    it('should return null if neither opener nor parent is available', () => {
      expect(getWindowParent()).toBeNull();
    });

    it('should return null if window.parent === window', () => {
      afterEachCallback = setupWindowParentMock('parent', undefined, window);
      expect(getWindowParent()).toBeNull();
    });
  });
});

describe('isMessage', () => {
  it.each([
    [{ id: 'mock.id', message: 'mock.message' }, true],
    [{ id: 999, message: 'mock.message' }, false],
    [{ id: 'mock.id', message: 999 }, false],
    [null, false],
    [{}, false],
    ['mock.message', false],
  ])('should return true for valid PostMessage: %s', (obj, expected) => {
    expect(isMessage(obj)).toBe(expected);
  });
});

describe('isResponse', () => {
  it.each([
    [{ id: 'mock.id' }, true],
    [{ id: 999 }, false],
    [{}, false],
    ['mock.id', false],
  ])(
    'should return true if given an object with a string id: %s',
    (given, expected) => {
      expect(isResponse(given)).toBe(expected);
    }
  );
});

describe('makeMessage', () => {
  it.each([
    ['mock.message', undefined, undefined],
    ['mock.message', 'mock.id', undefined],
    ['mock.message', 'mock.id', 'mock.payload'],
  ])(
    'should create a message object: message:%s, id:%s, payload:%s',
    (message, id, payload) => {
      asMock(nanoid).mockReturnValue(mockNanoId(1));

      expect(makeMessage(message, id, payload)).toEqual({
        message,
        id: id ?? mockNanoId(1),
        payload,
      });
    }
  );
});

describe('makeResponse', () => {
  it('should create a response message', () => {
    const id = 'mock.message.id';
    const payload = { key: 'mock.payload' };
    expect(makeResponse(id, payload)).toEqual({
      id,
      payload,
    });
  });
});

describe('requestParentResponse', () => {
  it('Throws an exception if called on a window without parent', async () => {
    await expect(requestParentResponse('request')).rejects.toThrow(
      'window parent is null, unable to send request.'
    );
  });
});

describe.each([['parent'], ['opener']] as const)(
  `requestParentResponse with %s`,
  type => {
    let addListenerSpy: jest.SpyInstance;
    let removeListenerSpy: jest.SpyInstance;
    let listenerCallback;
    let messageId;
    const mockPostMessage = jest.fn((data: PostMessage<unknown>) => {
      messageId = data.id;
    });
    beforeEach(() => {
      addListenerSpy = jest
        .spyOn(window, 'addEventListener')
        .mockImplementation((_event, cb) => {
          listenerCallback = cb;
        });
      removeListenerSpy = jest.spyOn(window, 'removeEventListener');
      afterEachCallback = setupWindowParentMock(type, mockPostMessage);
    });
    afterEach(() => {
      addListenerSpy.mockRestore();
      removeListenerSpy.mockRestore();
      mockPostMessage.mockClear();
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

describe('sendMessageToParent', () => {
  it('should throw an error if no parent window is available', () => {
    expect(() => {
      sendMessageToParent('test');
    }).toThrow('Parent window is null');
  });

  it('should send a message to the parent window', () => {
    const postMessage = jest.fn().mockName('postMessage');
    afterEachCallback = setupWindowParentMock('parent', postMessage);

    const message = 'mock.message';
    const id = 'mock-id';
    const payload = { key: 'mock.payload' };

    sendMessageToParent(message, id, payload);

    expect(postMessage).toHaveBeenCalledWith(
      makeMessage(message, id, payload),
      '*'
    );
  });
});
