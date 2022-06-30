import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ReactElement, useEffect, useState } from 'react';
import { Button } from '@deephaven/components';
import classNames from 'classnames';
import './GotoRow.scss';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridBottomBar from './IrisGridBottomBar';

export function isIrisGridProxyModel(
  model: IrisGridModel
): model is IrisGridProxyModel {
  return (model as IrisGridProxyModel).model !== undefined;
}

interface GotoRowProps {
  model: IrisGridModel;
  selectedRowNumber: string;
  onGotoRowNumberChanged: (rowValue: string) => void;
  onClose: () => void;
  animation?: string;
  isShown: boolean;
  className?: string;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;
}

const GotoRow = ({
  animation,
  isShown,
  className,
  onEntering,
  onEntered,
  onExiting,
  onExited,
  model,
  selectedRowNumber,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement => {
  const [row, setRow] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setRow(selectedRowNumber);
  }, [selectedRowNumber]);

  const res = 'Row number';

  const { rowCount } = model;

  return (
    <IrisGridBottomBar
      animation={animation}
      isShown={isShown}
      className={classNames('goto-row', {
        'copy-done': true,
      })}
      onEntering={onEntering}
      onEntered={onEntered}
      onExiting={onExiting}
      onExited={onExited}
    >
      <>
        <div className="goto-row-text">
          <h6>Go to row</h6>
        </div>
        <div className="goto-row-input">
          <input
            type="number"
            className="form-control"
            placeholder={res}
            onChange={event => {
              const rowNumber = event.target.value;
              setRow(rowNumber);
              if (
                rowNumber !== '' &&
                (parseInt(rowNumber, 10) < 0 ||
                  parseInt(rowNumber, 10) > rowCount)
              ) {
                setError('Invalid row index');
              } else if (rowNumber !== '' && parseInt(rowNumber, 10) === 0) {
                onGotoRowNumberChanged('1');
                setError('');
              } else {
                onGotoRowNumberChanged(event.target.value);
                setError('');
              }
            }}
            value={row}
          />
        </div>
        <div className="goto-row-text">
          <h6>of {rowCount}</h6>
        </div>
        {error && (
          <div className="goto-row-error">
            <h6>{error}</h6>
          </div>
        )}
        <div className="goto-row-close">
          <Button kind="ghost" onClick={onClose}>
            <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
          </Button>
        </div>
      </>
    </IrisGridBottomBar>
  );
};

export default GotoRow;
