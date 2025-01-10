import React, {
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import classNames from 'classnames';
import { vsKebabVertical } from '@deephaven/icons';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  Button,
  type DropdownActions,
  DropdownMenu,
  type PopperOptions,
  Tooltip,
} from '@deephaven/components';
import './ConsoleStatusBar.scss';
import { EMPTY_FUNCTION } from '@deephaven/utils';

const POPPER_OPTIONS: PopperOptions = { placement: 'bottom-end' };

interface ConsoleStatusBarProps {
  children?: ReactNode;
  dh: typeof DhType;
  session: DhType.IdeSession;
  overflowActions?: DropdownActions;
}

function ConsoleStatusBar({
  children,
  dh,
  session,
  overflowActions,
}: ConsoleStatusBarProps): ReactElement {
  const [pendingCommandCount, setPendingCommandCount] = useState(0);

  const handleCommandStarted = useCallback(
    async (event: DhType.Event<{ result: Promise<unknown> }>) => {
      setPendingCommandCount(count => count + 1);

      try {
        const { result } = event.detail;
        await result;
      } catch (error) {
        // No-op, fall through
      }

      setPendingCommandCount(count => count - 1);
    },
    []
  );

  useEffect(
    function startListening() {
      return session.addEventListener(
        dh.IdeSession.EVENT_COMMANDSTARTED,
        handleCommandStarted
      );
    },
    [dh, handleCommandStarted, session]
  );

  let statusIconClass = null;
  let tooltipText = null;
  if (pendingCommandCount > 0) {
    // Connected, Pending
    statusIconClass = 'console-status-icon-pending';
    tooltipText = 'Worker is busy';
  } else {
    // Connected, Idle
    statusIconClass = 'console-status-icon-idle';
    tooltipText = 'Worker is idle';
  }

  const hasActions =
    overflowActions != null &&
    (!Array.isArray(overflowActions) || overflowActions.length > 0);

  return (
    <div className="console-pane-status-bar">
      <div>
        <div className={classNames('console-status-icon', statusIconClass)} />
        <Tooltip>{tooltipText}</Tooltip>
      </div>
      {children}
      {hasActions && (
        <Button
          kind="ghost"
          icon={vsKebabVertical}
          tooltip="More Actions..."
          aria-label="More Actions..."
          // no-op: click is handled in `DropdownMenu`
          onClick={EMPTY_FUNCTION}
        >
          <DropdownMenu
            actions={overflowActions}
            popperOptions={POPPER_OPTIONS}
          />
        </Button>
      )}
    </div>
  );
}

export default ConsoleStatusBar;
