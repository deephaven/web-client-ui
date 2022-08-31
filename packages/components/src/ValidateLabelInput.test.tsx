import React from 'react';
import { render, screen } from '@testing-library/react';
import ValidateLabelInput, {
  ValidateLabelInputProps,
} from './ValidateLabelInput';
import UISwitch from './UISwitch';

function makeLabel({
  children = <UISwitch on={false} onClick={jest.fn()} />,
  labelText,
  hintText,
  isModified,
  validationError,
  showValidationError,
  id,
  'data-testid': dataTestId = 'TestValidateLabelInput',
}: Partial<ValidateLabelInputProps> = {}) {
  return render(
    <ValidateLabelInput
      data-testid={dataTestId}
      labelText={labelText}
      hintText={hintText}
      isModified={isModified}
      validationError={validationError}
      showValidationError={showValidationError}
      id={id}
    >
      {children}
    </ValidateLabelInput>
  );
}

it('mounts and unmounts properly', () => {
  makeLabel();
});

it('get element by data-testid works', () => {
  const testId = 'test id for ValidateLabelInput';
  makeLabel({ 'data-testid': testId });
  expect(screen.queryByTestId(testId)).not.toBeNull();
});

it('shows hint, label, and validation text error', () => {
  const hintText = 'VALIDATION HINT';
  const labelText = 'VALIDATION LABEL';
  const validationError = 'VALIDATION ERROR';
  makeLabel({ hintText, labelText, validationError });

  expect(screen.queryByText(hintText)).not.toBeNull();
  expect(screen.queryByText(labelText)).not.toBeNull();
  expect(screen.queryByText(validationError)).not.toBeNull();
});
