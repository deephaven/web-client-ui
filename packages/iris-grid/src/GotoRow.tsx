import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ReactElement, useEffect, useState } from 'react';
import { Button } from '@deephaven/components';
import './GotoRow.scss';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';

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
}

const GotoRow = ({
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
    <div className="goto-row">
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
              onGotoRowNumberChanged('');
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
    </div>
  );
};

export default GotoRow;
