import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TestUtils from './TestUtils';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('asMock', () => {
  const someFunc: (name: string) => number = jest.fn(
    (name: string): number => name.length
  );

  TestUtils.asMock(someFunc).mockImplementation(name => name.split(',').length);

  expect(someFunc('a,b,c')).toEqual(3);
});

describe('findLastCall', () => {
  it('should return undefined if call not matched', () => {
    const fn = jest.fn<void, [string, number]>();

    fn('AAA', 1);

    const result = TestUtils.findLastCall(fn, ([text, _num]) => text === 'BBB');
    expect(result).toBeUndefined();
  });

  it('should find the last mock call matching the predicate', () => {
    const fn = jest.fn<void, [string, number]>();

    fn('AAA', 1);
    fn('BBB', 1);
    fn('BBB', 2);
    fn('CCC', 1);

    const result = TestUtils.findLastCall(fn, ([text, _num]) => text === 'BBB');
    expect(result).toEqual(['BBB', 2]);
  });
});

describe('makeMockContext', () => {
  it('should make a MockContext object', () => {
    const mockContext = TestUtils.makeMockContext();
    Object.keys(mockContext).forEach(key => {
      expect(mockContext[key]).toEqual(expect.any(Function));
    });
  });

  describe('createLinearGradient', () => {
    it('should return an object with an addColorStop property', () => {
      const mockContext = TestUtils.makeMockContext();
      expect(mockContext.createLinearGradient()).toEqual(
        expect.objectContaining({ addColorStop: expect.any(Function) })
      );
    });
  });

  describe('measureText', () => {
    it('should return an object with a width property', () => {
      const mockContext = TestUtils.makeMockContext();
      expect(mockContext.measureText('test')).toEqual(
        expect.objectContaining({ width: 40 })
      );
    });
  });
});

describe('click', () => {
  const user = userEvent.setup();
  const clickHandler = jest.fn();
  const doubleClickHandler = jest.fn();
  const rightClickHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    return render(
      <button
        type="button"
        onClick={clickHandler}
        onDoubleClick={doubleClickHandler}
        onContextMenu={rightClickHandler}
      >
        button
      </button>
    );
  });

  it('should left click', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button);
    expect(clickHandler).toHaveBeenCalled();
  });

  it('should left click with control key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { ctrlKey: true });
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler.mock.calls[0][0].ctrlKey).toBeTruthy();
  });

  it('should left click with shift key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { shiftKey: true });
    expect(clickHandler).toHaveBeenCalledTimes(1);
    expect(clickHandler.mock.calls[0][0].shiftKey).toBeTruthy();
  });

  it('should double left click', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { dblClick: true });
    expect(doubleClickHandler).toHaveBeenCalled();
  });

  it('should right click', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { rightClick: true });
    expect(rightClickHandler).toHaveBeenCalled();
  });

  it('should double left click with control key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { dblClick: true, ctrlKey: true });
    expect(doubleClickHandler).toHaveBeenCalledTimes(1);
    expect(doubleClickHandler.mock.calls[0][0].ctrlKey).toBeTruthy();
  });

  it('should right click with control key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { rightClick: true, ctrlKey: true });
    expect(rightClickHandler).toHaveBeenCalledTimes(1);
    expect(rightClickHandler.mock.calls[0][0].ctrlKey).toBeTruthy();
  });

  it('should double left click with shift key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { dblClick: true, shiftKey: true });
    expect(doubleClickHandler).toHaveBeenCalledTimes(1);
    expect(doubleClickHandler.mock.calls[0][0].shiftKey).toBeTruthy();
  });

  it('should right click with shift key down', async () => {
    const button = screen.getByRole('button');
    await TestUtils.click(user, button, { rightClick: true, shiftKey: true });
    expect(rightClickHandler).toHaveBeenCalledTimes(1);
    expect(rightClickHandler.mock.calls[0][0].shiftKey).toBeTruthy();
  });
});

describe('createMockProxy', () => {
  it('should proxy property access as jest.fn() unless explicitly set', () => {
    const mock = TestUtils.createMockProxy<Record<string, unknown>>({
      name: 'mock.name',
    });

    expect(mock.name).toEqual('mock.name');
    expect(mock.propA).toBeInstanceOf(jest.fn().constructor);
    expect(mock.propB).toBeInstanceOf(jest.fn().constructor);
  });

  it('should not interfere with `await` by not proxying `then` property', async () => {
    const mock = TestUtils.createMockProxy<Record<string, unknown>>({});
    expect(mock.then).toBeUndefined();

    const result = await mock;

    expect(result).toBe(mock);
  });

  it('should only show `in` for explicit properties', () => {
    const mock = TestUtils.createMockProxy<Record<string, unknown>>({
      name: 'mock.name',
      age: 42,
    });

    expect('name' in mock).toBeTruthy();
    expect('age' in mock).toBeTruthy();
    expect('blah' in mock).toBeFalsy();
  });
});

describe('extractCallArgs', () => {
  const fn = (a: string, b: string) => a.length + b.length;
  const mockFn = jest.fn(fn);

  it('should return null if no calls have been made', () => {
    const args = TestUtils.extractCallArgs(mockFn, 0);
    expect(args).toBeNull();
  });

  it('should return null if not given a mock fn', () => {
    fn('john', 'doe');
    const args = TestUtils.extractCallArgs(fn, 0);
    expect(args).toBeNull();
  });

  it.each([
    [0, ['aaa', '111']],
    [1, ['bbb', '222']],
    [2, ['ccc', '333']],
    [3, null],
  ] as const)(
    'should return call args if index in range',
    (callIndex, expected) => {
      mockFn('aaa', '111');
      mockFn('bbb', '222');
      mockFn('ccc', '333');

      const args = TestUtils.extractCallArgs(mockFn, callIndex);
      expect(args).toEqual(expected);
    }
  );
});
