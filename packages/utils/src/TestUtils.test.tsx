import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TestUtils from './TestUtils';

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
