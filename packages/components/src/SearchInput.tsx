import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowLeft, vsArrowRight, vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
import Button from './Button';
import './SearchInput.scss';

interface QueryParams {
  queriedColumnIndex: number | undefined;
  changeQueriedColumnIndex: (direction: 'forward' | 'back') => void;
}
interface SearchInputProps {
  value: string;
  placeholder: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  className: string;
  disabled?: boolean;
  matchCount: number;
  id: string;
  'data-testid'?: string;
  queryParams?: QueryParams;
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
    queryParams: undefined,
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
      onBlur,
      onChange,
      className,
      disabled,
      matchCount,
      id,
      onKeyDown,
      'data-testid': dataTestId,
      queryParams,
    } = this.props;

    let matchCountSection;

    if (queryParams && matchCount > 1) {
      matchCountSection = (
        <>
          <Button
            kind="ghost"
            className="search-change-button"
            type="button"
            onClick={() => {
              queryParams.changeQueriedColumnIndex('back');
            }}
            icon={vsArrowLeft}
            tooltip="Next match"
          />
          <span className="search-change-text">
            {queryParams.queriedColumnIndex !== undefined &&
              `${queryParams.queriedColumnIndex + 1} of `}
            {matchCount}
          </span>
          <Button
            kind="ghost"
            className="search-change-button"
            type="button"
            onClick={() => {
              queryParams.changeQueriedColumnIndex('forward');
            }}
            icon={vsArrowRight}
            tooltip="Next match"
          />
        </>
      );
    } else {
      matchCountSection = matchCount > 0 && (
        <span className="match_count">{matchCount}</span>
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
          <div
            className="search-change-selection"
            ref={this.searchChangeSelection}
          >
            {matchCountSection}
          </div>
        ) : (
          <span className="search-icon">
            <FontAwesomeIcon icon={vsSearch} />
          </span>
        )}
      </div>
    );
  }
}

export default SearchInput;
