import React, { PureComponent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { vsSearch } from '@deephaven/icons';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import './SearchInput.scss';

class SearchInput extends PureComponent {
  constructor(props) {
    super(props);
    this.inputField = React.createRef();
  }

  focus() {
    this.inputField.current.focus();
  }

  render() {
    const {
      value,
      placeholder,
      onChange,
      className,
      matchCount,
      id,
      onKeyDown,
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

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  className: PropTypes.string,
  matchCount: PropTypes.number,
  id: PropTypes.string,
};

SearchInput.defaultProps = {
  placeholder: 'Search',
  className: '',
  matchCount: null,
  onKeyDown: () => {},
  id: '',
};

export default SearchInput;
