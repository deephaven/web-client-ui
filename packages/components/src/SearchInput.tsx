import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
import './SearchInput.scss';

interface SearchInputProps {
  value: string;
  placeholder: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  className: string;
  matchCount: number;
  id: string;
  'data-testid'?: string;
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
      onChange,
      className,
      matchCount,
      id,
      onKeyDown,
      'data-testid': dataTestId,
    } = this.props;
    return (
      <div className={classNames('search-group', className)}>
        <input
          type="search"
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          className="form-control"
          placeholder={placeholder}
          ref={this.inputField}
          id={id}
          data-testid={dataTestId}
        />
        {matchCount != null && (
          <span className="search-match">{matchCount}</span>
        )}
        <span className="search-icon">
          <FontAwesomeIcon icon={vsSearch} />
        </span>
      </div>
    );
  }
}

export default SearchInput;
