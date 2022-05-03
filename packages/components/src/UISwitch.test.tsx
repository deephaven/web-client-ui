import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UISwitch from './UISwitch';

function makeUISwitch(testId: string, onClick) {
  return render(<UISwitch on onClick={onClick} data-testid={testId} />);
}

it('mounts and unmounts properly', () => {
  function click() {
    return true;
  }

  const testId = 'test id for UISwitch';
  const testSwitch = makeUISwitch(testId, click);
  testSwitch.unmount();
});

it('get element by data-testid works', () => {
  let result = false;
  const changeFalseToTrue = () => {
    result = true;
  };
  const testId = 'test id for UISwitch';
  const testSwitch = makeUISwitch(testId, changeFalseToTrue);
  const elements = testSwitch.getAllByTestId(testId);
  expect(elements.length).toBe(1);
  const button = elements[0];
  expect(button instanceof HTMLButtonElement).toBe(true);
  expect(result).toBe(false);
  userEvent.click(button);
  expect(result).toBe(true);
});
