import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowLeft, vsArrowRight, vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
import './SearchInput.scss';

interface SelectedParams {
  numberSelected: number;
  selectedIndex: number;
  length: number;
  increaseSelected: () => void;
  decreaseSelected: () => void;
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
  selectedParams?: SelectedParams;
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
    selectedParams: undefined,
  };

  constructor(props: SearchInputProps) {
    super(props);
    this.inputField = React.createRef();
  }

  inputField: React.RefObject<HTMLInputElement>;

  focus(): void {
    this.inputField.current?.focus();
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
      selectedParams,
    } = this.props;

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

        {selectedParams != null && selectedParams.numberSelected === 1 ? (
          <div className="search-change-selection">
            <button
              className="search-change-button"
              type="button"
              onClick={() => {
                selectedParams.decreaseSelected();
              }}
            >
              <FontAwesomeIcon icon={vsArrowLeft} />
            </button>
            <span className="search-change-text">
              {selectedParams.selectedIndex} of {selectedParams.length}
            </span>
            <button
              className="search-change-button"
              type="button"
              onClick={() => {
                selectedParams.increaseSelected();
              }}
            >
              <FontAwesomeIcon icon={vsArrowRight} />
            </button>
          </div>
        ) : (
          <>
            {matchCount != null && (
              <span className="search-match">{matchCount}</span>
            )}
            <span className="search-icon">
              <FontAwesomeIcon icon={vsSearch} />
            </span>
          </>
        )}
      </div>
    );
  }
}

export default SearchInput;
