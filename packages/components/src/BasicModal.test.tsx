import React from 'react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import BasicModal, { BasicModalProps } from './BasicModal';

const DEFAULT_BODY_TEXT = 'DEFAULT_TEXT';
const DEFAULT_TEST_ID = 'DEFAULT_TEST_ID';

function makeWrapper(partialProps: Partial<BasicModalProps> | undefined = {}) {
  const props = {
    'data-testid': DEFAULT_TEST_ID,
    bodyText: DEFAULT_BODY_TEXT,
    headerText: '',
    isConfirmDanger: false,
    isOpen: true,
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    ...partialProps,
  };

  // eslint-disable-next-line react/jsx-props-no-spreading
  return render(<BasicModal {...props} />);
}

it('mounts and unmounts without failing', () => {
  makeWrapper();
});

it('focuses default button on first render after opening', () => {
  const { getByTestId } = makeWrapper();
  expect(getByTestId(`${DEFAULT_TEST_ID}-btn-confirm`)).toHaveFocus();
});

it.each([true, false])(
  'sets button style based on isConfirmDanger value: %s',
  isConfirmDanger => {
    const { getByTestId } = makeWrapper({ isConfirmDanger });
    expect(getByTestId(`${DEFAULT_TEST_ID}-btn-confirm`)).toHaveClass(
      isConfirmDanger ? 'btn-danger' : 'btn-primary'
    );
  }
);

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
