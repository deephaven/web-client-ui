import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { dhCheckSquare, vsWarning } from '@deephaven/icons';
import { Button, LoadingSpinner } from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import IrisGridBottomBar from './IrisGridBottomBar';
import './PendingDataBottomBar.scss';

const HIDE_TIMEOUT = 3000;

const MAX_NUMBER_ROWS_SHOWN = 5;

export type PendingDataBottomBarProps = {
  onSave: () => Promise<void>;
  onDiscard: () => Promise<void>;
  discardTooltip?: string;
  saveTooltip?: string;
  isSaving?: boolean;
  pendingDataErrors: Map<number, Error[]>;
  pendingDataMap: Map<number, { data: Map<number, { value: unknown }> }>;
  onEntering?: () => void;
  onEntered?: () => void;
  onExiting?: () => void;
  onExited?: () => void;
};

export const PendingDataBottomBar = ({
  isSaving = false,
  onSave,
  onDiscard,
  discardTooltip,
  saveTooltip,
  pendingDataErrors,
  pendingDataMap,
  onEntering,
  onEntered,
  onExiting,
  onExited,
}: PendingDataBottomBarProps): JSX.Element => {
  const [isSuccessShown, setIsSuccessShown] = useState(false);
  const [wasSuccessShown, setWasSuccessShown] = useState(false);
  const successTimeout = useRef<NodeJS.Timeout>();
  const prevIsSaving = usePrevious(isSaving);
  const error = useMemo(() => {
    if (pendingDataErrors.size === 0) {
      return null;
    }
    if (pendingDataErrors.size <= MAX_NUMBER_ROWS_SHOWN) {
      return `Key can't be empty (on pending row${
        pendingDataErrors.size > 1 ? 's' : ''
      } ${Array.from(pendingDataErrors.keys()).join(', ').trim()})`;
    }
    return `Key can't be empty (on ${pendingDataErrors.size} rows)`;
  }, [pendingDataErrors]);

  useEffect(() => {
    if (prevIsSaving && !isSaving && error == null) {
      setIsSuccessShown(true);
      setWasSuccessShown(true);
      successTimeout.current = setTimeout(() => {
        setIsSuccessShown(false);
      }, HIDE_TIMEOUT);
    }
  }, [error, isSaving, prevIsSaving]);

  useEffect(() => {
    if (successTimeout.current && pendingDataMap.size > 0) {
      // A change just occurred while the success message was still being shown, just hide the success message
      clearTimeout(successTimeout.current);
      setIsSuccessShown(false);
      setWasSuccessShown(false);
    }
  }, [pendingDataMap]);

  useEffect(
    () => () =>
      successTimeout.current ? clearTimeout(successTimeout.current) : undefined,
    []
  );

  const pendingRowCount = pendingDataMap.size;
  let commitIcon;
  if (isSaving) {
    commitIcon = <LoadingSpinner />;
  } else if (wasSuccessShown) {
    commitIcon = dhCheckSquare;
  }

  return (
    <IrisGridBottomBar
      className="pending-data-bottom-bar"
      isShown={pendingRowCount > 0 || isSuccessShown}
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
      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={vsWarning} />
          <span>{`${error}`}</span>
        </div>
      )}
      {!error && (
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
          disabled={isSaving || wasSuccessShown || error != null}
          tooltip={saveTooltip}
        >
          {isSaving && `Committing...`}
          {!isSaving && wasSuccessShown && `Success`}
          {!isSaving && !wasSuccessShown && `Commit`}
        </Button>
      </div>
    </IrisGridBottomBar>
  );
};

export default IrisGridBottomBar;
