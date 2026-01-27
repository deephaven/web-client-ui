/* eslint-disable react/jsx-props-no-spreading */
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsPassFilled, vsCopy } from '@deephaven/icons';
import { useCopyToClipboard } from '@deephaven/react-hooks';
import { ActionButton, Icon, Text, type ActionButtonProps } from './spectrum';
import { Tooltip } from './popper';

export interface CopyButtonProps
  extends Omit<ActionButtonProps, 'aria-label' | 'onPress'> {
  /** The value to copy when clicked, accepts string or function returning a string. */
  copy: string | (() => string);
  /** Optional tooltip label ex. 'Copy column name'. Defaults to 'Copy'. */
  tooltip?: string;
}

/**
 * Button that has a copy icon, and copies text to a clipboard when clicked.
 */
function CopyButton({
  copy,
  tooltip = 'Copy',
  children,
  ...rest
}: CopyButtonProps): JSX.Element {
  const [copied, copyToClipboard] = useCopyToClipboard();
  const currentTooltip = copied ? 'Copied' : tooltip;

  return (
    <ActionButton
      {...rest}
      aria-label={currentTooltip}
      onPress={() => {
        copyToClipboard(typeof copy === 'function' ? copy() : copy);
      }}
    >
      <Icon
        UNSAFE_className={
          children == null ? 'action-button-icon-with-tooltip' : undefined
        }
      >
        <FontAwesomeIcon icon={copied ? vsPassFilled : vsCopy} />
      </Icon>
      {children != null && <Text>{children}</Text>}
      {/* Assumes children means button has a label, and no longer needs a tooltip */}
      {(children == null || tooltip !== 'Copy') && (
        <Tooltip>{currentTooltip}</Tooltip>
      )}
    </ActionButton>
  );
}

CopyButton.displayName = 'CopyButton';

export default CopyButton;
