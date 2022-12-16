import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsPass, vsWarning } from '@deephaven/icons';
import { Button, LoadingSpinner } from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import IrisGridBottomBar from './IrisGridBottomBar';
import './PendingDataBottomBar.scss';
import { PendingDataMap } from './CommonTypes';

const HIDE_TIMEOUT = 3000;

const MAX_NUMBER_ROWS_SHOWN = 5;

export type PendingDataBottomBarProps = {
  onSave: () => Promise<void>;
  onDiscard: () => Promise<void>;
  discardTooltip?: string;
  saveTooltip?: string;
  isSaving?: boolean;
  error?: string | null;
  pendingDataErrors: Map<number, Error[]>;
  pendingDataMap: PendingDataMap;
  onEntering?: () => void;
  onEntered?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
};

export function PendingDataBottomBar({
  isSaving = false,
  onSave,
  onDiscard,
  discardTooltip,
  saveTooltip,
  error,
  pendingDataErrors,
  pendingDataMap,
  onEntering,
  onEntered,
  onExiting,
  onExited,
}: PendingDataBottomBarProps): JSX.Element {
  const [isSuccessShown, setIsSuccessShown] = useState(false);
  const [wasSuccessShown, setWasSuccessShown] = useState(false);
  const successTimeout = useRef<ReturnType<typeof setTimeout>>();
  const prevIsSaving = usePrevious(isSaving);
  const errorMessage = useMemo(() => {
    if (pendingDataErrors.size === 0) {
      return error;
    }
    if (pendingDataErrors.size <= MAX_NUMBER_ROWS_SHOWN) {
      return `Key can't be empty (on pending row${
        pendingDataErrors.size > 1 ? 's' : ''
      } ${Array.from(pendingDataErrors.keys()).join(', ').trim()})`;
    }
    return `Key can't be empty (on ${pendingDataErrors.size} rows)`;
  }, [error, pendingDataErrors]);

  useEffect(
    function showSuccessMessage() {
      if (
        prevIsSaving != null &&
        prevIsSaving &&
        !isSaving &&
        errorMessage == null
      ) {
        setIsSuccessShown(true);
        setWasSuccessShown(true);
        successTimeout.current = setTimeout(() => {
          setIsSuccessShown(false);
        }, HIDE_TIMEOUT);
      }
    },
    [errorMessage, isSaving, prevIsSaving]
  );

  useEffect(
    function hideSuccessMessage() {
      if (successTimeout.current && pendingDataMap.size > 0) {
        // A change just occurred while the success message was still being shown, just hide the success message
        clearTimeout(successTimeout.current);
        setIsSuccessShown(false);
        setWasSuccessShown(false);
      }
    },
    [pendingDataMap]
  );

  useEffect(function cleanupTimeout() {
    return () =>
      successTimeout.current ? clearTimeout(successTimeout.current) : undefined;
  }, []);

  const pendingRowCount = pendingDataMap.size;
  let commitIcon;
  if (isSaving) {
    commitIcon = <LoadingSpinner />;
  } else if (wasSuccessShown) {
    commitIcon = vsPass;
  }

  return (
    <IrisGridBottomBar
      className="pending-data-bottom-bar"
      isShown={pendingRowCount > 0 || isSuccessShown || errorMessage != null}
      onEntering={onEntering}
      onEntered={onEntered}
      onExiting={onExiting}
      onExited={() => {
        setWasSuccessShown(false);
        if (onExited) {
          onExited();
        }
      }}
    >
      {errorMessage != null && errorMessage !== '' && (
        <div className="error-message">
          <FontAwesomeIcon icon={vsWarning} />
          <span>{`${errorMessage}`}</span>
        </div>
      )}
      {(errorMessage == null || errorMessage === '') && (
        <div className="status-message">
          {pendingRowCount > 0 && (
            <span>{`${pendingRowCount} row${
              pendingRowCount > 1 ? 's' : ''
            } pending`}</span>
          )}
        </div>
      )}
      <div className="buttons-container">
        {!isSaving && !wasSuccessShown && (
          <Button kind="secondary" onClick={onDiscard} tooltip={discardTooltip}>
            Discard
          </Button>
        )}
        <Button
          kind={wasSuccessShown ? 'success' : 'primary'}
          onClick={onSave}
          icon={commitIcon}
          disabled={isSaving || wasSuccessShown || errorMessage != null}
          tooltip={saveTooltip}
        >
          {isSaving && `Committing...`}
          {!isSaving && wasSuccessShown && `Success`}
          {!isSaving && !wasSuccessShown && `Commit`}
        </Button>
      </div>
    </IrisGridBottomBar>
  );
}

export default PendingDataBottomBar;
