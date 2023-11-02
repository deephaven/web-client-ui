import React, { PureComponent } from 'react';
import debounce from 'lodash.debounce';
import SearchInput from './SearchInput';

interface DebouncedSearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  className: string;
  matchCount: number;
  debounceMs: number;
  id: string;
  'data-testid'?: string;
}

interface DebouncedSearchInputState {
  value: string;
}

class DebouncedSearchInput extends PureComponent<
  DebouncedSearchInputProps,
  DebouncedSearchInputState
> {
  static defaultProps = {
    placeholder: 'Search',
    className: '',
    matchCount: null,
    debounceMs: 250,
    id: '',
    'data-testid': undefined,
  };

  constructor(props: DebouncedSearchInputProps) {
    super(props);
    this.searchInput = React.createRef();
    this.handleChange = this.handleChange.bind(this);
    this.sendUpdate = debounce(this.sendUpdate.bind(this), props.debounceMs);

    this.state = {
      value: props.value,
    };
  }

  componentDidUpdate(prevProps: DebouncedSearchInputProps): void {
    const { value } = this.props;
    if (prevProps.value !== value) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ value });
    }
  }

  searchInput: React.RefObject<SearchInput>;

  focus(): void {
    this.searchInput.current?.focus();
  }

  handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ value: event.target.value }, this.sendUpdate);
  }

  sendUpdate(): void {
    const { onChange } = this.props;
    const { value } = this.state;
    onChange(value);
  }

  render(): JSX.Element {
    const {
      placeholder,
      className,
      matchCount,
      id,
      'data-testid': dataTestId,
    } = this.props;
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
        data-testid={dataTestId}
      />
    );
  }
}

export default DebouncedSearchInput;
