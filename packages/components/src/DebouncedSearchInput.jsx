import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce';
import SearchInput from './SearchInput';

class DebouncedSearchInput extends PureComponent {
  constructor(props) {
    super(props);
    this.searchInput = React.createRef();
    this.handleChange = this.handleChange.bind(this);
    this.sendUpdate = debounce(this.sendUpdate.bind(this), props.debounceMs);

    this.state = {
      value: props.value,
    };
  }

  componentDidUpdate(prevProps) {
    const { value } = this.props;
    if (prevProps.value !== value) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ value });
    }
  }

  focus() {
    this.searchInput.current.focus();
  }

  handleChange(event) {
    this.setState({ value: event.target.value }, this.sendUpdate);
  }

  sendUpdate() {
    const { onChange } = this.props;
    const { value } = this.state;
    onChange(value);
  }

  render() {
    const { placeholder, className, matchCount, id } = this.props;
    const { value } = this.state;
    return (
      <SearchInput
        value={value}
        placeholder={placeholder}
        onChange={this.handleChange}
        className={className}
        matchCount={matchCount}
        ref={this.searchInput}
        id={id}
      />
    );
  }
}

DebouncedSearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  matchCount: PropTypes.number,
  debounceMs: PropTypes.number,
  id: PropTypes.string,
};

DebouncedSearchInput.defaultProps = {
  placeholder: 'Search',
  className: '',
  matchCount: null,
  debounceMs: 250,
  id: '',
};

export default DebouncedSearchInput;
