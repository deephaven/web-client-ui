import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { Button } from '@deephaven/components';
import './GotoRow.scss';
import IrisGridModel from './IrisGridModel';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';

interface GotoRowProps {
  model: IrisGridModel;
  selectedRowNumber: string;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

const GotoRow = ({
  model,
  selectedRowNumber,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement => {
  const [row, setRow] = useState('');
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    setRow(selectedRowNumber);
  }, [selectedRowNumber]);

  const res = 'Row number';

  // useEffect(() => {
  //   console.log('asdfas');
  //   if (isIrisGridTableModelTemplate(model)) {
  //     const { table } = model;
  //     setRowCount(table.size);
  //   }
  // }, [model]);

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
            if (
              row === '' ||
              (parseInt(rowNumber, 10) > 0 &&
                parseInt(rowNumber, 10) <= rowCount)
            ) {
              onGotoRowNumberChanged(event);
            }
            setRow(rowNumber);
          }}
          value={row}
        />
      </div>
      <div className="goto-row-text">
        <h6>of {rowCount}</h6>
      </div>
      <div className="goto-row-close">
        <Button kind="ghost" onClick={onClose}>
          <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
        </Button>
      </div>
    </div>
  );
};

export default GotoRow;
