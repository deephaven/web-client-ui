import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowLeft, vsArrowRight, vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
import Button from './Button';
import './SearchInput.scss';
import { GLOBAL_SHORTCUTS } from './shortcuts';
import { ContextActions } from './context-actions';

interface SearchInputProps {
  value: string;
  placeholder: string;
  endPlaceholder?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  className: string;
  disabled?: boolean;
  matchCount: number;
  id: string;
  'data-testid'?: string;
  cursor?: {
    index: number | undefined;
    next: (direction: 'forward' | 'back') => void;
  };
}

class SearchInput extends PureComponent<SearchInputProps> {
  static defaultProps = {
    placeholder: 'Search',
    className: '',
    matchCount: null,
    onKeyDown(): void {
      // no-op
    },
    id: '',
    'data-testid': undefined,
    cursor: undefined,
  };

  constructor(props: SearchInputProps) {
    super(props);
    this.inputField = React.createRef();
    this.searchChangeSelection = React.createRef();
  }

  componentDidMount(): void {
    this.setInputPaddingRight();
  }

  componentDidUpdate(): void {
    this.setInputPaddingRight();
  }

  focus(): void {
    this.inputField.current?.focus();
  }

  select(): void {
    this.inputField.current?.select();
  }

  inputField: React.RefObject<HTMLInputElement>;

  searchChangeSelection: React.RefObject<HTMLDivElement>;

  setInputPaddingRight(): void {
    const inputField = this.inputField.current;
    const searchChangeSelection = this.searchChangeSelection.current;
    if (inputField && searchChangeSelection) {
      const paddingRight = searchChangeSelection.getBoundingClientRect().width;
      inputField.style.paddingRight = `${paddingRight}px`;
    }
  }

  render(): JSX.Element {
    const {
      value,
      placeholder,
      endPlaceholder,
      onBlur,
      onChange,
      className,
      disabled,
      matchCount,
      id,
      onKeyDown,
      'data-testid': dataTestId,
      cursor,
    } = this.props;

    let matchCountSection;
    const contextActions = [
      {
        action: () => cursor?.next('forward'),
        shortcut: GLOBAL_SHORTCUTS.NEXT,
      },
      {
        action: () => cursor?.next('back'),
        shortcut: GLOBAL_SHORTCUTS.PREVIOUS,
      },
    ];

    if (cursor && matchCount > 1) {
      matchCountSection = (
        <>
          <Button
            kind="ghost"
            className="search-change-button"
            type="button"
            onClick={() => {
              cursor.next('back');
            }}
            icon={vsArrowLeft}
            tooltip={`Previous match (${GLOBAL_SHORTCUTS.PREVIOUS.getDisplayText()})`}
          />
          <span className="search-change-text">
            {cursor.index !== undefined && `${cursor.index + 1} of `}
            {matchCount}
          </span>
          <Button
            kind="ghost"
            className="search-change-button"
            type="button"
            onClick={() => {
              cursor.next('forward');
            }}
            icon={vsArrowRight}
            tooltip={`Next match (${GLOBAL_SHORTCUTS.NEXT.getDisplayText()})`}
          />
        </>
      );
    } else {
      matchCountSection = matchCount > 0 && (
        <span className="search-match">{matchCount}</span>
      );
    }

    return (
      <div className={classNames('search-group', className)}>
        <input
          type="search"
          value={value}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="form-control"
          disabled={disabled}
          placeholder={placeholder}
          ref={this.inputField}
          id={id}
          data-testid={dataTestId}
        />

        {matchCount != null ? (
          <>
            <div
              className="search-change-selection"
              ref={this.searchChangeSelection}
            >
              {matchCountSection}
            </div>
            <ContextActions actions={contextActions} />
          </>
        ) : (
          <span className="search-end-content">
            {(endPlaceholder ?? '') !== '' && value === '' && (
              <span className="search-end-placeholder">{endPlaceholder}</span>
            )}
            <FontAwesomeIcon icon={vsSearch} />
          </span>
        )}
      </div>
    );
  }
}

export default SearchInput;
