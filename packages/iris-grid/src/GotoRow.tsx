import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose } from '@deephaven/icons';
import React, { ChangeEvent, ReactElement, useEffect, useRef } from 'react';
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
  gotoRow: string;
  gotoRowError: string;
  onSubmit: () => void;
  model: IrisGridModel;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  isShown: boolean;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;
}

function GotoRow({
  gotoRow,
  gotoRowError,
  onSubmit,
  isShown,
  onEntering,
  onEntered,
  onExiting,
  onExited,
  model,
  onGotoRowNumberChanged,
  onClose,
}: GotoRowProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);

  const res = 'Row number';

  const { rowCount } = model;

  useEffect(() => {
    // when row changes without focus (i.e. via context menu), re-select input
    if (document.activeElement !== inputRef.current) {
      inputRef.current?.select();
    }
  }, [gotoRow]);

  return (
    <IrisGridBottomBar
      isShown={isShown}
      className={classNames('goto-row')}
      onEntering={onEntering}
      onEntered={() => {
        onEntered();
        inputRef.current?.select();
      }}
      onExiting={onExiting}
      onExited={onExited}
    >
      <>
        <div className="goto-row-wrapper">
          <div className="goto-row-text">Go to row</div>
          <div className="goto-row-input">
            <input
              ref={inputRef}
              type="number"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  e.preventDefault();
                  onSubmit();
                }
              }}
              className={classNames('form-control', {
                'is-invalid': gotoRowError !== '',
              })}
              placeholder={res}
              onChange={event => {
                onGotoRowNumberChanged(event);
              }}
              value={gotoRow}
            />
          </div>
          <div className="goto-row-text">
            of {dh.i18n.NumberFormat.format(DEFAULT_FORMAT_STRING, rowCount)}
          </div>
          {gotoRowError && (
            <div className="goto-row-error text-danger">{gotoRowError}</div>
          )}
        </div>
        <div className="goto-row-close">
          <Button kind="ghost" onClick={onClose}>
            <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
          </Button>
        </div>
      </>
    </IrisGridBottomBar>
  );
}

export default GotoRow;
