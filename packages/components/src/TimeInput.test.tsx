import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeUtils } from '@deephaven/utils';
import type { SelectionSegment } from './MaskedInput';
import TimeInput from './TimeInput';

type SelectionDirection = SelectionSegment['selectionDirection'];

const DEFAULT_VALUE = TimeUtils.parseTime('12:34:56');

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
    const cursorPosition = 0;

    input.focus();
    userEvent.type(input, text, {
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
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
    testSelectAndType(1, '0', '02:34:56');
    testSelectAndType(0, '0', '02:34:56');
    testSelectAndType(0, '00', '00:34:56');
    testSelectAndType(1, '00', '00:34:56');

    testSelectAndType(0, '3', '03:34:56');
    testSelectAndType(1, '3', '03:34:56');

    testSelectAndType(4, '5', '12:54:56');
    testSelectAndType(4, '55', '12:55:56');

    testSelectAndType(1, '000000', '00:00:00');
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

    input.setSelectionRange(cursorPosition, cursorPosition);
    userEvent.type(input, '', {
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    const movements: number[] = ([] as number[]).concat(movement);

    console.log(`start ${input.selectionStart} end ${input.selectionEnd}`);
    for (let i = 0; i < movements.length; i += 1) {
      const arrowMovement = movements[i];

      for (let j = 0; j < arrowMovement; j += 1) {
        userEvent.type(input, '{ArrowRight}');
      }

      for (let j = 0; j > arrowMovement; j -= 1) {
        userEvent.type(input, '{arrowleft}');
      }
    }

    console.log(`start ${input.selectionStart} end ${input.selectionEnd}`);

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
    testArrowNavigation(8, -1, makeSelection(3, 5, 'backward'));
    // testArrowNavigation(8, -2, makeSelection(0, 2, 'backward'));
    // testArrowNavigation(8, -10, makeSelection(0, 2, 'backward'));
    // testArrowNavigation(5, -1, makeSelection(0, 2, 'backward'));
  });

  // it('handles going right', () => {
  //   testArrowNavigation(0, 1, makeSelection(3, 5, 'backward'));
  //   testArrowNavigation(0, 2, makeSelection(6, 8, 'backward'));
  //   testArrowNavigation(0, 10, makeSelection(6, 8, 'backward'));
  //   testArrowNavigation(8, 1, makeSelection(6, 8, 'backward'));
  //   testArrowNavigation(8, 10, makeSelection(6, 8, 'backward'));
  //   testArrowNavigation(5, 1, makeSelection(6, 8, 'backward'));
  // });

  // it('handles a mix of left/right', () => {
  //   testArrowNavigation(0, [2, -1], makeSelection(3, 5, 'backward'));
  //   testArrowNavigation(0, [3, -3], makeSelection(0, 2, 'backward'));
  //   testArrowNavigation(8, [3, -1], makeSelection(3, 5, 'backward'));
  // });
});

// describe('arrow up and down updates values in segments', () => {
//   function testArrowValue(
//     cursorPosition: number,
//     movement: number | number[],
//     expectedValue: string,
//     value = DEFAULT_VALUE
//   ) {
//     const timeInput = makeTimeInput({ value });

//     selectRange(timeInput, makeSelection(cursorPosition, cursorPosition));

//     const movements: number[] = ([] as number[]).concat(movement);
//     const inputField = timeInput.find('input');
//     for (let i = 0; i < movements.length; i += 1) {
//       const arrowMovement = movements[i];
//       for (let j = 0; j < arrowMovement; j += 1) {
//         inputField.simulate('keydown', { key: 'ArrowDown' });
//       }

//       for (let j = 0; j > arrowMovement; j -= 1) {
//         inputField.simulate('keydown', { key: 'ArrowUp' });
//       }
//     }

//     expect(timeInput.find('input').prop('value')).toEqual(expectedValue);

//     timeInput.unmount();
//   }

//   it('handles down arrow', () => {
//     testArrowValue(0, 1, '11:34:56');
//     testArrowValue(0, 3, '09:34:56');
//     testArrowValue(0, 1, '23:00:00', 0);
//     testArrowValue(3, 1, '00:59:00', 0);
//     testArrowValue(6, 1, '00:00:59', 0);
//     testArrowValue(6, 3, '12:34:53');
//   });

//   it('handles up arrow', () => {
//     testArrowValue(0, -1, '13:34:56');
//     testArrowValue(0, -3, '15:34:56');
//     testArrowValue(0, -1, '00:00:00', TimeUtils.parseTime('23:00:00'));
//     testArrowValue(3, -1, '00:00:00', TimeUtils.parseTime('00:59:00'));
//     testArrowValue(6, -1, '00:00:00', TimeUtils.parseTime('00:00:59'));
//     testArrowValue(6, -3, '12:34:59');
//   });
// });

// it('updates properly when the value prop is updated', () => {
//   const timeInput = makeTimeInput();

//   expect(timeInput.find('input').prop('value')).toEqual('12:34:56');

//   timeInput.setProps({ value: 0 });
//   timeInput.update();

//   expect(timeInput.find('input').prop('value')).toEqual('00:00:00');

//   timeInput.unmount();
// });
