/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';
import { HierarchicalCheckboxMenu, Popper } from '@deephaven/components';

class Dialog extends Component {
  constructor(props) {
    super(props);

    this.sampleInput = React.createRef();

    this.handleUpdateCheckboxMap = this.handleUpdateCheckboxMap.bind(this);

    this.state = {
      isShown: false,
      checkBoxMap: new Map([
        [
          'Parent A',
          new Map([
            ['Child 1', true],
            ['Child 2', false],
          ]),
        ],
        [
          'Parent B',
          new Map([
            ['Child 3', true],
            ['Child 4', false],
            ['Child 5', true],
            ['Child 6', false],
          ]),
        ],
        ['Leaf Parent', true],
      ]),
    };
  }

  handleUpdateCheckboxMap(checkBoxMap) {
    this.setState({
      checkBoxMap,
    });
  }

  renderChild() {
    return (
      <div className="p-3">
        <h4>Sample Child</h4>
        <div className="form-group">
          <label htmlFor="exampleInput1">
            Input Label
            <input
              ref={this.sampleInput}
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
      </div>
    );
  }

  render() {
    const { isShown, checkBoxMap } = this.state;

    return (
      <div>
        <h2 className="ui-title">Popover Dialog</h2>
        <p>
          Popover dialog that can contain interactive elements, can be set to
          self close on blur.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          onClick={() => {
            if (isShown) {
              this.setState({ isShown: false });
            } else {
              this.setState({ isShown: true });
            }
          }}
        >
          Open Dialog
          <Popper
            options={{ placement: 'bottom' }}
            isShown={isShown} // controls if its shown or not
            onEntered={() => {
              // Example setting focus on entered child
              // Could also be performed within the didMount if child is a component
              this.sampleInput.current.focus();
            }}
            onExited={() => {
              this.setState({ isShown: false });
            }}
            closeOnBlur // if you want dialog to self close, on click outside
            interactive // if popper contents will be interactable
          >
            {this.renderChild()}
          </Popper>
        </button>
        <p>
          The Hierarchical Checkbox Menu uses a popover dialog to display
          hierarchical groups of checkboxes.
        </p>

        <HierarchicalCheckboxMenu
          menuText="Checkbox Menu"
          valueMap={checkBoxMap}
          onUpdateValueMap={this.handleUpdateCheckboxMap}
        />
      </div>
    );
  }
}

export default Dialog;
