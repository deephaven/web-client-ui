import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsClose, vsArrowUp, vsArrowDown } from '@deephaven/icons';
import React, {
  ChangeEvent,
  KeyboardEvent,
  ReactElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { dh } from '@deephaven/jsapi-types';
import {
  Type as FilterType,
  TypeValue as FilterTypeValue,
} from '@deephaven/filters';
import { Button, DateTimeInput, Select } from '@deephaven/components';
import { TableUtils } from '@deephaven/jsapi-utils';
import classNames from 'classnames';
import './GotoRow.scss';
import shortid from 'shortid';
import IrisGridModel from './IrisGridModel';
import IrisGridProxyModel from './IrisGridProxyModel';
import IrisGridBottomBar from './IrisGridBottomBar';
import { ColumnName } from './CommonTypes';

function isIrisGridProxyModel(
  model: IrisGridModel
): model is IrisGridProxyModel {
  return (model as IrisGridProxyModel).model !== undefined;
}

const DEFAULT_FORMAT_STRING = '###,##0';

interface GotoRowProps {
  gotoRow: string;
  gotoRowError: string;
  gotoValueError: string;
  onGotoRowSubmit: () => void;
  model: IrisGridModel;
  onGotoRowNumberChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  isShown: boolean;
  onEntering: () => void;
  onEntered: () => void;
  onExiting: () => void;
  onExited: () => void;

  gotoValueSelectedColumnName: ColumnName;
  gotoValue: string;
  gotoValueFilter: FilterTypeValue;
  onGotoValueSelectedColumnNameChanged: (columnName: ColumnName) => void;
  onGotoValueSelectedFilterChanged: (filter: FilterTypeValue) => void;
  onGotoValueChanged: (input: string) => void;
  onGotoValueSubmit: (isBackward?: boolean) => void;
}

export type GotoRowElement = { focus: () => void };

const GotoRow = forwardRef<GotoRowElement, GotoRowProps>(
  (
    {
      gotoRow,
      gotoRowError,
      gotoValueError,
      onGotoRowSubmit,
      isShown,
      onEntering,
      onEntered,
      onExiting,
      onExited,
      model,
      onGotoRowNumberChanged,
      onClose,
      gotoValueSelectedColumnName,
      gotoValue,
      gotoValueFilter,
      onGotoValueSelectedColumnNameChanged,
      onGotoValueSelectedFilterChanged,
      onGotoValueChanged,
      onGotoValueSubmit,
    }: GotoRowProps,
    ref
  ): ReactElement => {
    const gotoRowInputRef = useRef<HTMLInputElement>(null);
    const gotoValueInputRef = useRef<HTMLInputElement>(null);

    const [isGotoRowActive, setIsGotoRowActive] = useState(false);
    let columns: dh.Column[] = [];

    if (isIrisGridProxyModel(model) && model.table !== undefined) {
      ({ columns } = model.table);
    }

    const { dh, rowCount } = model;

    const gotoRowInputId = useMemo(() => `goto-row-input-${shortid()}`, []);

    const handleGotoValueNumberKeyDown = (
      e: KeyboardEvent<HTMLInputElement>
    ): void => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        onGotoValueSubmit();
      } else if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        (gotoValue === `${Number.POSITIVE_INFINITY}` ||
          gotoValue === `${Number.NEGATIVE_INFINITY}`)
      ) {
        onGotoValueInputChanged('');
      }
    };

    const handleGotoValueKeySubmit = (
      e: KeyboardEvent<HTMLInputElement>
    ): void => {
      if (e.key === 'Enter') {
        e.stopPropagation();
        e.preventDefault();
        onGotoValueSubmit(e.shiftKey);
      }
    };

    const index = model.getColumnIndexByName(gotoValueSelectedColumnName);

    const selectedColumn = columns[index ?? 0];

    const columnType = selectedColumn?.type;

    const normalizedType = TableUtils.getNormalizedType(columnType);
    const onGotoValueInputChanged = (value?: string): void => {
      onGotoValueChanged(value ?? '');
    };
    useImperativeHandle(ref, () => ({
      focus(): void {
        setIsGotoRowActive(true);
        gotoRowInputRef.current?.select();
      },
    }));
    const selectInput = (): void => {
      // when row changes without focus (i.e. via context menu), re-select input
      if (
        isGotoRowActive &&
        document.activeElement !== gotoRowInputRef.current
      ) {
        gotoRowInputRef.current?.select();
      } else if (
        !isGotoRowActive &&
        document.activeElement !== gotoValueInputRef.current
      ) {
        gotoValueInputRef.current?.select();
      }
    };
    useEffect(selectInput, [isGotoRowActive]);

    const renderValueInput = (): JSX.Element => {
      switch (normalizedType) {
        case TableUtils.dataType.DECIMAL:
        case TableUtils.dataType.INT:
          return (
            <div className="goto-row-input">
              <input
                ref={gotoValueInputRef}
                className={classNames('form-control', {
                  'is-invalid': gotoValueError !== '',
                })}
                onKeyDown={handleGotoValueNumberKeyDown}
                placeholder="value"
                onChange={e => {
                  const value = e.target.value.toLowerCase();
                  // regex tests for
                  if (/^-?[0-9]*\.?[0-9]*$/.test(e.target.value)) {
                    onGotoValueInputChanged(e.target.value);
                  } else if (value === '-i' || value === '-infinity') {
                    onGotoValueInputChanged(`${Number.NEGATIVE_INFINITY}`);
                  } else if (value === 'i' || value === 'infinity') {
                    onGotoValueInputChanged(`${Number.POSITIVE_INFINITY}`);
                  }
                }}
                value={gotoValue}
                aria-label="Value Input"
              />
            </div>
          );
        case TableUtils.dataType.DATETIME:
          return (
            <div className="goto-value-date-time-input">
              <DateTimeInput
                ref={gotoValueInputRef}
                className={classNames(
                  'form-control',
                  'goto-value-date-time-input',
                  {
                    'is-invalid': gotoValueError !== '',
                  }
                )}
                defaultValue={gotoValue}
                onChange={onGotoValueInputChanged}
                onSubmit={handleGotoValueKeySubmit}
                aria-label="Value Input"
              />
            </div>
          );
        case TableUtils.dataType.STRING:
          return (
            <>
              <div className="goto-row-input">
                <Select
                  className="custom-select"
                  onChange={eventTargetValue => {
                    onGotoValueSelectedFilterChanged(
                      eventTargetValue as FilterTypeValue
                    );
                  }}
                  value={gotoValueFilter}
                  aria-label="filter-type-select"
                >
                  <option
                    key={FilterType.eqIgnoreCase}
                    value={FilterType.eqIgnoreCase}
                  >
                    Equals (case-insensitive)
                  </option>
                  <option
                    key={FilterType.containsIgnoreCase}
                    value={FilterType.containsIgnoreCase}
                  >
                    Contains (case-insensitive)
                  </option>
                  <option key={FilterType.eq} value={FilterType.eq}>
                    Equals
                  </option>
                  <option key={FilterType.contains} value={FilterType.contains}>
                    Contains
                  </option>
                </Select>
              </div>
              <div className="goto-row-input">
                <input
                  ref={gotoValueInputRef}
                  className={classNames('form-control', {
                    'is-invalid': gotoValueError !== '',
                  })}
                  onKeyDown={handleGotoValueKeySubmit}
                  placeholder="value"
                  onChange={e => onGotoValueInputChanged(e.target.value)}
                  value={gotoValue}
                  aria-label="Value Input"
                />
              </div>
            </>
          );
        case TableUtils.dataType.BOOLEAN:
          return (
            <div className="goto-row-input">
              <Select
                className="custom-select"
                onChange={eventTargetValue => {
                  onGotoValueInputChanged(eventTargetValue);
                }}
                value={gotoValue}
                aria-label="Value Input"
              >
                <option aria-label="null value" key="null" value="" />
                <option key="true" value="true">
                  true
                </option>
                <option key="false" value="false">
                  false
                </option>
              </Select>
            </div>
          );
        default:
          return (
            <div className="goto-row-input">
              <input
                ref={gotoValueInputRef}
                className="form-control"
                onKeyDown={handleGotoValueKeySubmit}
                placeholder="value"
                onChange={e => onGotoValueInputChanged(e.target.value)}
                value={gotoValue}
                aria-label="Value Input"
              />
            </div>
          );
      }
    };
    return (
      <IrisGridBottomBar
        isShown={isShown}
        className={classNames('goto-row')}
        onEntering={onEntering}
        onEntered={() => {
          onEntered();
          selectInput();
        }}
        onExiting={onExiting}
        onExited={onExited}
      >
        <>
          <div className="goto-row-row">
            <div
              className={classNames('goto-row-wrapper', {
                'is-inactive': !isGotoRowActive,
              })}
              onClick={() => setIsGotoRowActive(true)}
              onFocus={() => setIsGotoRowActive(true)}
              role="group"
            >
              <label className="goto-row-text" htmlFor={gotoRowInputId}>
                Go to row
              </label>
              <div className="goto-row-input">
                <input
                  ref={gotoRowInputRef}
                  data-testid="goto-row-input"
                  type="number"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      e.preventDefault();
                      onGotoRowSubmit();
                    }
                  }}
                  className={classNames('form-control', {
                    'is-invalid': gotoRowError !== '',
                  })}
                  placeholder="Row number"
                  onChange={event => {
                    onGotoRowNumberChanged(event);
                  }}
                  value={gotoRow}
                  id={gotoRowInputId}
                />
              </div>
              <div className="goto-row-text">
                of{' '}
                {dh.i18n.NumberFormat.format(DEFAULT_FORMAT_STRING, rowCount)}
              </div>
              {gotoRowError && (
                <div className="text-danger">{gotoRowError}</div>
              )}
            </div>
            <div className="goto-row-close">
              <Button kind="ghost" onClick={onClose}>
                <FontAwesomeIcon icon={vsClose} style={{ marginRight: '0' }} />
              </Button>
            </div>
          </div>
          {model.isSeekRowAvailable && (
            <div className="goto-row-row">
              <div
                className={classNames('goto-row-wrapper', {
                  'is-inactive': isGotoRowActive,
                })}
                onClick={() => setIsGotoRowActive(false)}
                onFocus={() => setIsGotoRowActive(false)}
                role="group"
              >
                <div className="goto-row-text">Go to value</div>
                <div className="goto-row-input">
                  <Select
                    className="custom-select"
                    onChange={eventTargetValue => {
                      const columnName = eventTargetValue;
                      onGotoValueSelectedColumnNameChanged(columnName);
                    }}
                    value={gotoValueSelectedColumnName}
                    aria-label="column-name-select"
                    id="column-name-select"
                  >
                    {columns.map(column => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </Select>
                </div>

                {renderValueInput()}

                <div>
                  <Button
                    tooltip="Next match"
                    icon={vsArrowUp}
                    kind="ghost"
                    disabled={gotoValue === ''}
                    onClick={() => {
                      onGotoValueSubmit(true);
                    }}
                  />
                  <Button
                    tooltip="Previous match"
                    icon={vsArrowDown}
                    kind="ghost"
                    disabled={gotoValue === ''}
                    onClick={() => {
                      onGotoValueSubmit(false);
                    }}
                  />
                </div>
                {gotoValueError && (
                  <div className="text-danger">{gotoValueError}</div>
                )}
              </div>
            </div>
          )}
        </>
      </IrisGridBottomBar>
    );
  }
);
GotoRow.displayName = 'GotoRow';

export default GotoRow;
