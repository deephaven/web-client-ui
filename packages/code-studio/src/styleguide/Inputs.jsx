import React, { Component } from 'react';
import {
  AutoCompleteInput,
  AutoResizeTextarea,
  Checkbox,
  ComboBox,
  RadioItem,
  RadioGroup,
  SearchInput,
  TimeInput,
  CustomTimeSelect,
  UISwitch,
} from '@deephaven/components';
import DateInput from '../components/DateInput';

class Inputs extends Component {
  constructor(props) {
    super(props);

    this.handleRadioChange = this.handleRadioChange.bind(this);
    this.handleToggleClick = this.handleToggleClick.bind(this);
    this.handleSearchInputChange = this.handleSearchInputChange.bind(this);

    this.example = [
      { title: 'Title 1', value: 'Value 1' },
      { title: 'Title 2', value: 'Value 2' },
      { title: 'Title 3', value: 'Value 3' },
      { title: 'Title 4', value: 'Value 4' },
      { title: 'Title 5', value: 'Value 5' },
      { title: 'Title 6', value: 'Value 6' },
      { title: 'Title 7', value: 'Value 7' },
      { title: 'Title 8', value: 'Value 8' },
      { title: 'Title 9', value: 'Value 9' }, // intentional duplicate for testing
      { title: 'Title 9', value: 'Value 9' },
      { title: 'Title 10', value: 'Value 10' },
      { title: 'Title 11', value: 'Value 11' },
      { title: 'Title 12', value: 'Value 12' },
    ];

    this.timeouts = [
      { title: '1 minute', value: 1 * 60 * 1000 },
      { title: '5 minutes', value: 5 * 60 * 1000 },
      { title: '20 minutes', value: 20 * 60 * 1000 },
      { title: '45 minutes', value: 45 * 60 * 1000 },
      { title: '1 hour', value: 1 * 60 * 60 * 1000 },
      { title: '4 hours', value: 4 * 60 * 60 * 1000 },
    ];

    this.state = {
      on: false,
      searchValue: '',
      check1: true,
      check2: false,
      check3: false,
      check4: false,
      check5: null,
      radioValue: '1',
      customTimeValue: null,
      autoResizeTextareaValue:
        '-DLiveTableMonitor.updateThreads=8 -DLiveTableMonitor.printDependencyInformation=false -Dassertion.heapDump=true -Drequire.heapDump=true -Dassertion.heapDump=true -Drequire.heapDump=true',
    };
  }

  handleRadioChange(e) {
    this.setState({ radioValue: e.target.value });
  }

  handleToggleClick() {
    const { on } = this.state;
    this.setState({ on: !on });
  }

  handleSearchInputChange(e) {
    this.setState({ searchValue: e.target.value });
  }

  render() {
    const {
      on,
      radioValue,
      searchValue,
      check1,
      check2,
      check3,
      check4,
      check5,
      customTimeValue,
      autoResizeTextareaValue,
    } = this.state;
    return (
      <div className="style-guide-inputs">
        <h2 className="ui-title">Inputs</h2>
        <div className="row">
          <div className="col">
            <form>
              <div className="form-group">
                <label htmlFor="exampleInput1">
                  Input Label
                  <input
                    type="text"
                    className="form-control"
                    id="exampleInput1"
                    aria-describedby="emailHelp"
                    placeholder="Input Placeholder"
                  />
                </label>
                <small className="form-text text-muted">
                  Help text for a form imput
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="exampleInput2">
                  Input Label
                  <input
                    type="text"
                    className="form-control"
                    id="exampleInput2"
                    aria-describedby="emailHelp"
                    placeholder="Input Disabled"
                    disabled
                  />
                </label>
                <small className="form-text text-muted">Disabled input</small>
              </div>
              <div className="form-group">
                <label htmlFor="exampleInputPassword1">
                  Password
                  <input
                    type="password"
                    className="form-control"
                    id="exampleInputPassword1"
                    placeholder="Password"
                    defaultValue="123456789"
                  />
                </label>
              </div>
              <div className="form-group">
                <SearchInput
                  value={searchValue}
                  placeholder="Search Input"
                  onChange={this.handleSearchInputChange}
                />
              </div>
            </form>
          </div>

          <div className="col">
            <form>
              <h5> Checkboxes </h5>
              <Checkbox
                className="form-group"
                checked={check1}
                onChange={() => this.setState({ check1: !check1 })}
              >
                Checked checkbox
              </Checkbox>
              <Checkbox
                className="form-group"
                checked={check2}
                onChange={() => this.setState({ check2: !check2 })}
              >
                Unchecked checkbox
              </Checkbox>
              <Checkbox className="form-group" disabled>
                Disabled checkbox
              </Checkbox>
              <Checkbox
                className="form-group"
                isInvalid
                checked={check3}
                onChange={() => this.setState({ check3: !check3 })}
              >
                Invalid checkbox
              </Checkbox>
              <Checkbox
                className="form-group"
                checked={check4}
                onChange={() => this.setState({ check4: !check4 })}
              >
                Add radio button
              </Checkbox>
              <Checkbox
                className="form-group"
                checked={check5}
                onChange={() => {
                  if (check5 == null) {
                    this.setState({ check5: true });
                  } else if (!check5) {
                    this.setState({ check5: null });
                  } else {
                    this.setState({ check5: false });
                  }
                }}
              >
                Indeterminate Cycle
              </Checkbox>
            </form>
          </div>

          <div className="col">
            <form>
              <h5> Radios </h5>
              <RadioGroup onChange={this.handleRadioChange} value={radioValue}>
                <RadioItem value="1">Toggle this custom radio</RadioItem>
                <RadioItem value="2">
                  Or toggle this other custom radio
                </RadioItem>
                <RadioItem value="3" disabled>
                  Disabled radio
                </RadioItem>
                <RadioItem value="4" isInvalid>
                  Invalid radio
                </RadioItem>
                {check4 && <RadioItem value="5">Extra radio item</RadioItem>}
              </RadioGroup>
            </form>
          </div>

          <div className="col">
            <div className="form-group">
              <h5>Selection Menu</h5>
              <select defaultValue="0" className="custom-select">
                <option disabled value="0">
                  Custom Selection
                </option>
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
              </select>
            </div>

            <div className="form-group">
              <select defaultValue="0" className="custom-select" disabled>
                <option disabled value="0">
                  Custom Selection
                </option>
                <option value="1">One</option>
                <option value="2">Two</option>
                <option value="3">Three</option>
              </select>
            </div>

            <div className="form-group">
              <h5>Input with Select</h5>
              <div className="input-group">
                <ComboBox
                  options={this.example}
                  inputPlaceholder="10.128.0.8"
                  searchPlaceholder="Search actions here"
                />
              </div>
              <br />
              <div className="input-group" disabled>
                <ComboBox
                  options={this.example}
                  inputPlaceholder="10.128.0.8"
                  searchPlaceholder="Search actions here"
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <h5>AutoCompleteInput</h5>
              <AutoCompleteInput
                options={this.example}
                noMatchText="No Matches."
              />
            </div>
          </div>

          <div className="col">
            <div className="form-group">
              <h5>Toggle Buttons</h5>
              <div className="form-inline justify-content-between">
                <label>{String(on)}</label>
                <UISwitch on={on} onClick={this.handleToggleClick} />
              </div>
              <div className="form-inline justify-content-between">
                <label>{String(!on)}</label>
                <UISwitch on={!on} onClick={this.handleToggleClick} />
              </div>
              <div className="form-inline justify-content-between">
                <label className="isInvalid">isInvalid</label>
                <UISwitch on={!on} isInvalid onClick={this.handleToggleClick} />
              </div>
              <div className="form-inline justify-content-between">
                <label className="disabled">disabled</label>
                <UISwitch on={!on} disabled onClick={this.handleToggleClick} />
              </div>
            </div>
          </div>

          <div className="col">
            <div className="form-group">
              <h5>Time Input</h5>
              <TimeInput />
              <br />
              <h5>Date Input</h5>
              <DateInput />
              <small className="text-muted">Does not work in mock</small>
              <br />
              <h5>Custom Timeselect</h5>
              <CustomTimeSelect
                options={this.timeouts}
                value={customTimeValue}
                onChange={value => {
                  this.setState({ customTimeValue: value });
                }}
                customText="Custom Timeout"
                placeholder="Select a timeout"
                valueToTime={value => Math.round(value / 1000)}
                timeToValue={time => time * 1000}
              />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col">
            <div className="form-group">
              <h5>Auto Resize Textarea</h5>
              <AutoResizeTextarea
                value={autoResizeTextareaValue}
                delimiter=" -"
                onChange={value => {
                  this.setState({ autoResizeTextareaValue: value });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Inputs;
