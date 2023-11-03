import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsArrowLeft, vsArrowRight, vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
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
      queryParams,
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
          style={
            queryParams && {
              paddingRight:
                queryParams?.queriedColumnIndex !== undefined
                  ? '6rem'
                  : '4.5rem',
            }
          }
        />

        {matchCount != null && queryParams !== undefined ? (
          <div className="search-change-selection">
            <button
              className="search-change-button"
              type="button"
              onClick={() => {
                queryParams.changeQueriedColumnIndex('back');
              }}
              disabled={matchCount <= 1}
            >
              <FontAwesomeIcon icon={vsArrowLeft} />
            </button>
            <span className="search-change-text">
              {queryParams.queriedColumnIndex !== undefined &&
                matchCount > 1 &&
                `${queryParams.queriedColumnIndex + 1} of `}
              {matchCount}
            </span>
            <button
              className="search-change-button"
              type="button"
              onClick={() => {
                queryParams.changeQueriedColumnIndex('forward');
              }}
              disabled={matchCount <= 1}
            >
              <FontAwesomeIcon icon={vsArrowRight} />
            </button>
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
