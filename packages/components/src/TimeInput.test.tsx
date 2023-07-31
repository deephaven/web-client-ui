import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeUtils } from '@deephaven/utils';
import type { SelectionSegment } from './MaskedInput';
import TimeInput, { TimeInputElement } from './TimeInput';

type SelectionDirection = SelectionSegment['selectionDirection'];

const DEFAULT_VALUE = TimeUtils.parseTime('12:34:56');

const FIXED_WIDTH_SPACE = '\u2007';

function makeTimeInput({
  value = DEFAULT_VALUE,
  onChange = jest.fn(),
  ref = undefined,
}: {
  value?: number;
  onChange?: (timeInSec: number) => void;
  ref?: React.Ref<TimeInputElement>;
} = {}) {
  return render(<TimeInput value={value} onChange={onChange} ref={ref} />);
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
  async function testInput(
    user: ReturnType<typeof userEvent.setup>,
    text: string,
    expectedResult = text
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    await user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: 0,
      initialSelectionEnd: 2,
    });
    await user.keyboard(text);

    expect(input.value).toEqual(expectedResult);
    unmount();
  }
  it('handles typing in exactly the right characters', async () => {
    const user = userEvent.setup();
    await testInput(user, '12:34:56');
    await testInput(user, '09:11:00');
    await testInput(user, '00:00:00');
  });

  it('handles skipping punctuation', async () => {
    const user = userEvent.setup();
    await testInput(user, '120456', '12:04:56');
    await testInput(user, '091100', '09:11:00');
    await testInput(user, '000000', '00:00:00');
  });

  it('handles skipping the first hour', async () => {
    const user = userEvent.setup();
    await testInput(user, '34511', '03:45:11');
    await testInput(user, '90210', '09:02:10');
  });
});

describe('selection', () => {
  async function testSelectSegment(
    user: ReturnType<typeof userEvent.setup>,
    cursorPosition: number,
    expectedStart: number,
    expectedEnd: number,
    expectedDirection: SelectionDirection = 'backward'
  ) {
    const { unmount } = makeTimeInput();

    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    // user-event requires you type something, not an empty string
    await user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(expectedStart);
    expect(input.selectionEnd).toEqual(expectedEnd);
    expect(input.selectionDirection).toEqual(expectedDirection);
    unmount();
  }

  async function testSelectRange(
    user: ReturnType<typeof userEvent.setup>,
    selectionStart: number,
    selectionEnd: number,
    selectionDirection: SelectionDirection = 'forward'
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: selectionStart,
      initialSelectionEnd: selectionEnd,
    });

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(selectionStart);
    expect(input.selectionEnd).toEqual(selectionEnd);
    expect(input.selectionDirection).toEqual(selectionDirection);
    unmount();
  }

  it('automatically selects the correct segment when no range selected', async () => {
    const user = userEvent.setup();
    await testSelectSegment(user, 0, 0, 2);
    await testSelectSegment(user, 1, 0, 2);
    await testSelectSegment(user, 2, 0, 2);
    await testSelectSegment(user, 3, 3, 5);
    await testSelectSegment(user, 4, 3, 5);
    await testSelectSegment(user, 5, 3, 5);
    await testSelectSegment(user, 6, 6, 8);
    await testSelectSegment(user, 7, 6, 8);
    await testSelectSegment(user, 8, 6, 8);
  });

  it('does not affect a range if selected', async () => {
    const user = userEvent.setup();
    await testSelectRange(user, 0, 1);
    await testSelectRange(user, 0, 8);
    await testSelectRange(user, 5, 7);
    await testSelectRange(user, 5, 6, 'backward');
  });
});

describe('select and type', () => {
  async function testSelectAndType(
    user: ReturnType<typeof userEvent.setup>,
    cursorPosition: number,
    str: string,
    expectedResult: string
  ) {
    const elementRef = React.createRef<TimeInputElement>();
    const { unmount } = makeTimeInput({ ref: elementRef });
    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    // This triggers our selection logic so the segment gets selected
    // Just setting the selection and typing does not seem to work
    await user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });
    await user.keyboard(str);

    expect(input.value).toEqual(expectedResult);
    unmount();
  }
  it('handles typing after autoselecting a segment', async () => {
    const user = userEvent.setup();
    await testSelectAndType(user, 0, '0', '02:34:56');
    await testSelectAndType(user, 1, '0', '02:34:56');
    await testSelectAndType(user, 0, '00', '00:34:56');
    await testSelectAndType(user, 1, '00', '00:34:56');

    await testSelectAndType(user, 0, '3', '03:34:56');
    await testSelectAndType(user, 1, '3', '03:34:56');

    await testSelectAndType(user, 4, '5', '12:54:56');
    await testSelectAndType(user, 4, '55', '12:55:56');

    await testSelectAndType(user, 1, '000000', '00:00:00');

    // Jumps to the next section if the previous section is complete
    await testSelectAndType(user, 0, '35', `03:54:56`);

    // Validates the whole value, not just a substring
    await testSelectAndType(user, 9, '11`"();', `12:34:11`);
  });
  it('handles backspace', async () => {
    const user = userEvent.setup();
    // Replace selected section with fixed-width spaces
    await testSelectAndType(
      user,
      0,
      '{Backspace}',
      `${FIXED_WIDTH_SPACE}${FIXED_WIDTH_SPACE}:34:56`
    );
    await testSelectAndType(
      user,
      3,
      '{Backspace}',
      `12:${FIXED_WIDTH_SPACE}${FIXED_WIDTH_SPACE}:56`
    );

    // Allow deleting digits from the end
    await testSelectAndType(user, 9, '{Backspace}', `12:34`);

    // Add missing mask chars
    await testSelectAndType(user, 9, '{Backspace}{Backspace}12', `12:31:2`);
  });

  it('trims trailing mask and spaces', async () => {
    const user = userEvent.setup();
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');

    // input.setSelectionRange(3, 3);
    input.focus();
    await user.type(input, '{Shift}{Backspace}', {
      skipClick: true,
      initialSelectionStart: 3,
      initialSelectionEnd: 3,
    });

    await user.type(input, '{Shift}{Backspace}', {
      initialSelectionStart: 6,
      initialSelectionEnd: 6,
    });

    expect(input.value).toEqual(`12`);

    await user.type(input, '{Shift}{Backspace}', {
      initialSelectionStart: 1,
      initialSelectionEnd: 1,
    });

    expect(input.value).toEqual(``);

    unmount();
  });

  it('existing edge cases', async () => {
    const user = userEvent.setup();
    // Ideally it should change the first section to 20, i.e. '20:34:56'
    await testSelectAndType(user, 1, '5{arrowleft}2', `25:34:56`);

    // Ideally it should fill in with zeros when skipping positions, i.e. '03:34:56'
    await testSelectAndType(
      user,
      0,
      '{backspace}3',
      `${FIXED_WIDTH_SPACE}3:34:56`
    );
  });
});

describe('arrow left and right jumps segments', () => {
  /**
   *
   * @param cursorPosition The initial cursor position to start at
   * @param movement Keyboard movement to simulate, positive for right, negative for left. Eg. 2 means 2 right arrow presses, -3 means 3 left arrow presses
   * @param expectedSelection The selection to expect
   */
  async function testArrowNavigation(
    user: ReturnType<typeof userEvent.setup>,
    cursorPosition: number,
    movement: number | number[],
    expectedSelection: SelectionSegment
  ) {
    const { unmount } = makeTimeInput();
    const input: HTMLInputElement = screen.getByRole('textbox');
    input.focus();
    await user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    const movements: number[] = ([] as number[]).concat(movement);

    for (let i = 0; i < movements.length; i += 1) {
      const arrowMovement = movements[i];

      for (let j = 0; j < arrowMovement; j += 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.keyboard('[ArrowRight]');
      }

      for (let j = 0; j > arrowMovement; j -= 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.keyboard('[ArrowLeft]');
      }
    }

    const { selectionStart, selectionEnd, selectionDirection } =
      expectedSelection;

    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input.selectionStart).toEqual(selectionStart);
    expect(input.selectionEnd).toEqual(selectionEnd);
    expect(input.selectionDirection).toEqual(selectionDirection);

    unmount();
  }
  it('handles going left', async () => {
    const user = userEvent.setup();
    await testArrowNavigation(user, 0, -1, makeSelection(0, 2, 'backward'));
    await testArrowNavigation(user, 0, -10, makeSelection(0, 2, 'backward'));
    await testArrowNavigation(user, 8, -2, makeSelection(0, 2, 'backward'));
    await testArrowNavigation(user, 8, -1, makeSelection(3, 5, 'backward'));
    await testArrowNavigation(user, 8, -10, makeSelection(0, 2, 'backward'));
    await testArrowNavigation(user, 5, -1, makeSelection(0, 2, 'backward'));
  });

  it('handles going right', async () => {
    const user = userEvent.setup();
    await testArrowNavigation(user, 0, 1, makeSelection(3, 5, 'backward'));
    await testArrowNavigation(user, 0, 2, makeSelection(6, 8, 'backward'));
    await testArrowNavigation(user, 0, 10, makeSelection(6, 8, 'backward'));
    await testArrowNavigation(user, 8, 1, makeSelection(6, 8, 'backward'));
    await testArrowNavigation(user, 8, 10, makeSelection(6, 8, 'backward'));
    await testArrowNavigation(user, 5, 1, makeSelection(6, 8, 'backward'));
  });

  it('handles a mix of left/right', async () => {
    const user = userEvent.setup();
    await testArrowNavigation(
      user,
      0,
      [2, -1],
      makeSelection(3, 5, 'backward')
    );
    await testArrowNavigation(
      user,
      0,
      [3, -3],
      makeSelection(0, 2, 'backward')
    );
    await testArrowNavigation(
      user,
      8,
      [3, -1],
      makeSelection(3, 5, 'backward')
    );
  });
});

describe('arrow up and down updates values in segments', () => {
  async function testArrowValue(
    user: ReturnType<typeof userEvent.setup>,
    cursorPosition: number,
    movement: number | number[],
    expectedValue: string,
    value = DEFAULT_VALUE
  ) {
    const { unmount } = makeTimeInput({ value });

    const input: HTMLInputElement = screen.getByRole('textbox');

    input.focus();
    await user.type(input, '{Shift}', {
      skipClick: true,
      initialSelectionStart: cursorPosition,
      initialSelectionEnd: cursorPosition,
    });

    const movements: number[] = ([] as number[]).concat(movement);

    for (let i = 0; i < movements.length; i += 1) {
      const arrowMovement = movements[i];
      for (let j = 0; j < arrowMovement; j += 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.keyboard('[ArrowDown]');
      }

      for (let j = 0; j > arrowMovement; j -= 1) {
        // eslint-disable-next-line no-await-in-loop
        await user.keyboard('[ArrowUp]');
      }
    }

    expect(input.value).toEqual(expectedValue);

    unmount();
  }

  it('handles down arrow', async () => {
    const user = userEvent.setup();
    await testArrowValue(user, 0, 1, '11:34:56');
    await testArrowValue(user, 0, 3, '09:34:56');
    await testArrowValue(user, 0, 1, '23:00:00', 0);
    await testArrowValue(user, 3, 1, '00:59:00', 0);
    await testArrowValue(user, 6, 1, '00:00:59', 0);
    await testArrowValue(user, 6, 3, '12:34:53');
  });

  it('handles up arrow', async () => {
    const user = userEvent.setup();
    await testArrowValue(user, 0, -1, '13:34:56');
    await testArrowValue(user, 0, -3, '15:34:56');
    await testArrowValue(
      user,
      0,
      -1,
      '00:00:00',
      TimeUtils.parseTime('23:00:00')
    );
    await testArrowValue(
      user,
      3,
      -1,
      '00:00:00',
      TimeUtils.parseTime('00:59:00')
    );
    await testArrowValue(
      user,
      6,
      -1,
      '00:00:00',
      TimeUtils.parseTime('00:00:59')
    );
    await testArrowValue(user, 6, -3, '12:34:59');
  });
});
it('updates properly when the value prop is updated', () => {
  const { rerender } = makeTimeInput();

  const textbox: HTMLInputElement = screen.getByRole('textbox');
  expect(textbox.value).toEqual('12:34:56');

  rerender(<TimeInput value={0} onChange={jest.fn()} />);

  expect(textbox.value).toEqual('00:00:00');
});
