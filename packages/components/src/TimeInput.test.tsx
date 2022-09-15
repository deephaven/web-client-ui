import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeUtils } from '@deephaven/utils';
import type { SelectionSegment } from './MaskedInput';
import TimeInput from './TimeInput';

type SelectionDirection = SelectionSegment['selectionDirection'];

const DEFAULT_VALUE = TimeUtils.parseTime('12:34:56');

const FIXED_WIDTH_SPACE = '\u2007';

function makeTimeInput({ value = DEFAULT_VALUE, onChange = jest.fn() } = {}) {
  return render(<TimeInput value={value} onChange={onChange} />);
}

function makeSelection(
  selectionStart = 0,
  selectionEnd = 0,
  selectionDirection: SelectionDirection = 'none'
): SelectionSegment {
  return { selectionStart, selectionEnd, selectionDirection };
}

it('mounts and unmounts properly', () => {
  makeTimeInput();
});

describe('typing in matches mask', () => {
  function testInput(text: string, expectedResult = text) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');
    input.setSelectionRange(0, 0);

    input.focus();
    userEvent.type(input, text, {
      initialSelectionStart: 0,
      initialSelectionEnd: 0,
    });

    expect(input.value).toEqual(expectedResult);
    unmount();
  }
  it('handles typing in exactly the right characters', () => {
    testInput('12:34:56');
    testInput('09:11:00');
    testInput('00:00:00');
  });

  it('handles skipping punctuation', () => {
    testInput('120456', '12:04:56');
    testInput('091100', '09:11:00');
    testInput('000000', '00:00:00');
  });

  it('handles skipping the first hour', () => {
    testInput('34511', '03:45:11');
    testInput('90210', '09:02:10');
  });
});

describe('selection', () => {
  function testSelectSegment(
    cursorPosition: number,
    expectedStart: number,
    expectedEnd: number,
    expectedDirection: SelectionDirection = 'backward'
  ) {
    const { unmount } = makeTimeInput();

    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    input.setSelectionRange(cursorPosition, cursorPosition);
    userEvent.type(input, '');

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(expectedStart);
    expect(input.selectionEnd).toEqual(expectedEnd);
    expect(input.selectionDirection).toEqual(expectedDirection);
    unmount();
  }

  function testSelectRange(
    selectionStart: number,
    selectionEnd: number,
    selectionDirection: SelectionDirection = 'forward'
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    userEvent.type(input, '');

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(selectionStart);
    expect(input.selectionEnd).toEqual(selectionEnd);
    expect(input.selectionDirection).toEqual(selectionDirection);
    unmount();
  }

  it('automatically selects the correct segment when no range selected', () => {
    testSelectSegment(0, 0, 2);
    testSelectSegment(1, 0, 2);
    testSelectSegment(2, 0, 2);
    testSelectSegment(3, 3, 5);
    testSelectSegment(4, 3, 5);
    testSelectSegment(5, 3, 5);
    testSelectSegment(6, 6, 8);
    testSelectSegment(7, 6, 8);
    testSelectSegment(8, 6, 8);
  });

  it('does not affect a range if selected', () => {
    testSelectRange(0, 1);
    testSelectRange(0, 8);
    testSelectRange(5, 7);
    testSelectRange(5, 6, 'backward');
  });
});

describe('select and type', () => {
  function testSelectAndType(
    cursorPosition: number,
    str: string,
    expectedResult: string
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.setSelectionRange(cursorPosition, cursorPosition);

    userEvent.type(input, str);

    expect(input.value).toEqual(expectedResult);
    unmount();
  }
  it('handles typing after autoselecting a segment', () => {
    testSelectAndType(0, '0', '02:34:56');
    testSelectAndType(1, '0', '02:34:56');
    testSelectAndType(0, '00', '00:34:56');
    testSelectAndType(1, '00', '00:34:56');

    testSelectAndType(0, '3', '03:34:56');
    testSelectAndType(1, '3', '03:34:56');

    testSelectAndType(4, '5', '12:54:56');
    testSelectAndType(4, '55', '12:55:56');

    testSelectAndType(1, '000000', '00:00:00');
  });
  it('handles backspace', () => {
    // Replace selected section with fixed-width spaces
    testSelectAndType(
      0,
      '{backspace}',
      `${FIXED_WIDTH_SPACE}${FIXED_WIDTH_SPACE}:34:56`
    );
    testSelectAndType(
      3,
      '{backspace}',
      `12:${FIXED_WIDTH_SPACE}${FIXED_WIDTH_SPACE}:56`
    );

    // Allow deleting digits from the end
    testSelectAndType(9, '{backspace}', `12:34`);

    // Add missing mask chars
    testSelectAndType(9, '{backspace}{backspace}12', `12:31:2`);
  });

  it('trims trailing mask and spaces', () => {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.setSelectionRange(3, 3);

    userEvent.type(input, '{backspace}');

    input.setSelectionRange(9, 9);

    userEvent.type(input, '{backspace}');

    expect(input.value).toEqual(`12`);

    input.setSelectionRange(1, 1);

    userEvent.type(input, '{backspace}');

    expect(input.value).toEqual(``);

    unmount();
  });

  it('existing invalid behaviors that might need to be fixed', () => {
    // Expected: '20:34:56'?
    testSelectAndType(1, '5{arrowleft}2', `25:34:56`);

    // Fill in with zeros when skipping positions. Expected: '03:34:56'
    testSelectAndType(0, '{backspace}3', `${FIXED_WIDTH_SPACE}3:34:56`);

    // Not sure it's ok to skip to the next section when the input isn't valid for the current section
    // Expected: '03:34:56'?
    testSelectAndType(0, '35', `03:54:56`);

    // Should validate whole value
    // Expected: '03:54:11'
    testSelectAndType(9, '11`"();', `12:34:11\`"();`);
  });
});

describe('arrow left and right jumps segments', () => {
  /**
   *
   * @param cursorPosition The initial cursor position to start at
   * @param movement Keyboard movement to simulate, positive for right, negative for left. Eg. 2 means 2 right arrow presses, -3 means 3 left arrow presses
   * @param expectedSelection The selection to expect
   */
  function testArrowNavigation(
    cursorPosition: number,
    movement: number | number[],
    expectedSelection: SelectionSegment
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');
    input.focus();
    input.setSelectionRange(cursorPosition, cursorPosition);
    userEvent.type(input, '', {
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    const movements: number[] = ([] as number[]).concat(movement);

    for (let i = 0; i < movements.length; i += 1) {
      const arrowMovement = movements[i];

      for (let j = 0; j < arrowMovement; j += 1) {
        fireEvent.keyDown(input, { key: 'ArrowRight' });
        fireEvent.keyPress(input, { key: 'ArrowRight' });
        fireEvent.keyUp(input, { key: 'ArrowRight' });
      }

      for (let j = 0; j > arrowMovement; j -= 1) {
        fireEvent.keyDown(input, { key: 'ArrowLeft' });
        fireEvent.keyPress(input, { key: 'ArrowLeft' });
        fireEvent.keyUp(input, { key: 'ArrowLeft' });
      }
    }

    const {
      selectionStart,
      selectionEnd,
      selectionDirection,
    } = expectedSelection;

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(selectionStart);
    expect(input.selectionEnd).toEqual(selectionEnd);
    expect(input.selectionDirection).toEqual(selectionDirection);

    unmount();
  }
  it('handles going left', () => {
    testArrowNavigation(0, -1, makeSelection(0, 2, 'backward'));
    testArrowNavigation(0, -10, makeSelection(0, 2, 'backward'));
    testArrowNavigation(8, -2, makeSelection(0, 2, 'backward'));
    testArrowNavigation(8, -1, makeSelection(3, 5, 'backward'));
    testArrowNavigation(8, -10, makeSelection(0, 2, 'backward'));
    testArrowNavigation(5, -1, makeSelection(0, 2, 'backward'));
  });

  it('handles going right', () => {
    testArrowNavigation(0, 1, makeSelection(3, 5, 'backward'));
    testArrowNavigation(0, 2, makeSelection(6, 8, 'backward'));
    testArrowNavigation(0, 10, makeSelection(6, 8, 'backward'));
    testArrowNavigation(8, 1, makeSelection(6, 8, 'backward'));
    testArrowNavigation(8, 10, makeSelection(6, 8, 'backward'));
    testArrowNavigation(5, 1, makeSelection(6, 8, 'backward'));
  });

  it('handles a mix of left/right', () => {
    testArrowNavigation(0, [2, -1], makeSelection(3, 5, 'backward'));
    testArrowNavigation(0, [3, -3], makeSelection(0, 2, 'backward'));
    testArrowNavigation(8, [3, -1], makeSelection(3, 5, 'backward'));
  });
});

describe('arrow up and down updates values in segments', () => {
  function testArrowValue(
    cursorPosition: number,
    movement: number | number[],
    expectedValue: string,
    value = DEFAULT_VALUE
  ) {
    const { unmount } = makeTimeInput({ value });

    const input: HTMLInputElement = screen.getByRole('textbox');

    input.setSelectionRange(cursorPosition, cursorPosition);

    userEvent.type(input, '', {
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    const movements: number[] = ([] as number[]).concat(movement);

    for (let i = 0; i < movements.length; i += 1) {
      const arrowMovement = movements[i];
      for (let j = 0; j < arrowMovement; j += 1) {
        userEvent.type(input, '{arrowdown}');
      }

      for (let j = 0; j > arrowMovement; j -= 1) {
        userEvent.type(input, '{arrowup}');
      }
    }

    expect(input.value).toEqual(expectedValue);

    unmount();
  }

  it('handles down arrow', () => {
    testArrowValue(0, 1, '11:34:56');
    testArrowValue(0, 3, '09:34:56');
    testArrowValue(0, 1, '23:00:00', 0);
    testArrowValue(3, 1, '00:59:00', 0);
    testArrowValue(6, 1, '00:00:59', 0);
    testArrowValue(6, 3, '12:34:53');
  });

  it('handles up arrow', () => {
    testArrowValue(0, -1, '13:34:56');
    testArrowValue(0, -3, '15:34:56');
    testArrowValue(0, -1, '00:00:00', TimeUtils.parseTime('23:00:00'));
    testArrowValue(3, -1, '00:00:00', TimeUtils.parseTime('00:59:00'));
    testArrowValue(6, -1, '00:00:00', TimeUtils.parseTime('00:00:59'));
    testArrowValue(6, -3, '12:34:59');
  });
});
it('updates properly when the value prop is updated', () => {
  const { rerender } = makeTimeInput();

  const textbox: HTMLInputElement = screen.getByRole('textbox');
  expect(textbox.value).toEqual('12:34:56');

  rerender(<TimeInput value={0} onChange={jest.fn()} />);

  expect(textbox.value).toEqual('00:00:00');
});
