import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ReactElement, useState } from 'react';
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

const DEFAULT_FORMAT_STRING = '###,##0';

interface GotoRowProps {
  model: IrisGridModel;
  onGotoRowNumberChanged: (rowValue: string) => void;
  onClose: () => void;
  isShown: boolean;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;
}

const GotoRow = ({
  isShown,
  onEntering,
  onEntered,
  onExiting,
  onExited,
  model,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement => {
  const [row, setRow] = useState('');
  const [error, setError] = useState('');

  const res = 'Row number';

  const { rowCount } = model;

  return (
    <IrisGridBottomBar
      isShown={isShown}
      className={classNames('goto-row')}
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
            className={classNames('form-control', {
              'is-invalid': error !== '',
            })}
            placeholder={res}
            onChange={event => {
              const rowNumber = event.target.value;
              setRow(rowNumber);
              if (rowNumber === '') {
                setError('');
                return;
              }
              const rowInt = parseInt(event.target.value, 10);
              if (rowInt > rowCount || rowInt < -rowCount) {
                setError('Invalid row index');
              } else if (rowInt === 0) {
                onGotoRowNumberChanged('1');
                setError('');
              } else if (rowInt < 0) {
                onGotoRowNumberChanged(`${rowInt + rowCount + 1}`);
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
          <h6>
            of {dh.i18n.NumberFormat.format(DEFAULT_FORMAT_STRING, rowCount)}
          </h6>
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
