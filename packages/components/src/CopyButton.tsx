import React from 'react';
import { vsPassFilled, vsCopy } from '@deephaven/icons';
import { useCopyToClipboard } from '@deephaven/react-hooks';
import Button, { type ButtonKind } from './Button';

type CopyButtonProps = {
  /** The value to copy when clicked, accepts string or function returning a string. */
  copy: string | (() => string);
  /** The kind of button */
  kind?: ButtonKind;
  /** Optional tooltip label ex. 'Copy column name' */
  tooltip?: string;
  /** Optional extra classname */
  className?: string;
  /** Optional extra styles */
  style?: React.CSSProperties;
  /** Optional extra testid */
  'data-testid'?: string;
  /** Optional button children */
  children?: React.ReactNode;
};

/**
 * Button that has a copy icon, and copies text to a clipboard when clicked.
 */
function CopyButton({
  copy,
  kind = 'ghost',
  tooltip = 'Copy',
  className,
  style,
  'data-testid': dataTestId,
  children,
}: CopyButtonProps): JSX.Element {
  const [copied, copyToClipboard] = useCopyToClipboard();
  return (
    <Button
      kind={kind}
      className={className}
      style={style}
      data-testid={dataTestId}
      icon={copied ? vsPassFilled : vsCopy}
      tooltip={copied ? 'Copied' : tooltip}
      onClick={() => {
        copyToClipboard(typeof copy === 'function' ? copy() : copy);
      }}
    >
      {children}
    </Button>
  );
}

export default CopyButton;
