import React from 'react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import BasicModal from './BasicModal';

const DEFAULT_BODY_TEXT = 'DEFAULT_TEXT';
const DEFAULT_TEST_ID = 'DEFAULT_TEST_ID';

function makeWrapper(
  isOpen = true,
  bodyText = DEFAULT_BODY_TEXT,
  dataTestId = DEFAULT_TEST_ID,
  onConfirm = jest.fn()
) {
  return render(
    <BasicModal
      data-testid={dataTestId}
      isOpen={isOpen}
      headerText=""
      bodyText={bodyText}
      onConfirm={onConfirm}
    />
  );
}

it('mounts and unmounts without failing', () => {
  makeWrapper();
});

it('focuses default button on first render after opening', () => {
  const { getByTestId } = makeWrapper();
  expect(getByTestId(`${DEFAULT_TEST_ID}-btn-confirm`)).toHaveFocus();
});

it('does not re-focus default button on re-render', async () => {
  const user = userEvent.setup();
  const { getByTestId, rerender } = makeWrapper();
  await user.tab();
  expect(getByTestId(`${DEFAULT_TEST_ID}-btn-confirm`)).not.toHaveFocus();
  rerender(
    <BasicModal
      isOpen
      headerText=""
      bodyText={DEFAULT_BODY_TEXT}
      data-testid={DEFAULT_TEST_ID}
      onConfirm={jest.fn()}
    />
  );
  expect(getByTestId(`${DEFAULT_TEST_ID}-btn-confirm`)).not.toHaveFocus();
});
