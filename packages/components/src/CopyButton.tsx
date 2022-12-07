/**
 * Copy button that has an icon change when clicked, and copies the string passed in.
 *
 * props:
 * @param {string} copy the value to copy when clicked
 * @param {string} ButtonKind the kind of button
 * @param {string} tooltip optional tooltip label ex. 'Copy column name'
 * @param {string} className optional extra classname
 * @param {string} data-testid optional extra testid
 *
 *
 */

import React from 'react';
import { vsPassFilled, vsCopy } from '@deephaven/icons';
import { useCopyToClipboard } from '@deephaven/react-hooks';
import Button, { ButtonKind } from './Button';

type CopyButtonProps = {
  copy: string;
  kind?: ButtonKind;
  tooltip?: string;
  className?: string;
  'data-testid'?: string;
  children?: React.ReactNode;
};

const CopyButton = ({
  copy,
  kind = 'ghost',
  tooltip = 'Copy',
  className,
  'data-testid': dataTestId,
  children,
}: CopyButtonProps): JSX.Element => {
  const [copied, copyToClipboard] = useCopyToClipboard();
  return (
    <Button
      kind={kind}
      className={className}
      data-testid={dataTestId}
      icon={copied ? vsPassFilled : vsCopy}
      tooltip={copied ? 'Copied' : tooltip}
      onClick={() => {
        copyToClipboard(copy);
      }}
    >
      {children}
    </Button>
  );
};

export default CopyButton;
