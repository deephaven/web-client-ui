/* eslint no-alert: "off" */
/* eslint no-console: "off" */
import React, { Component } from 'react';
import {
  Flex,
  HierarchicalCheckboxMenu,
  Item,
  Picker,
  Popper,
  SpectrumCheckbox,
  type HierarchicalCheckboxValueMap,
  Button,
} from '@deephaven/components';
import SampleSection from './SampleSection';

interface DialogState {
  isShown: boolean;
  isPickerShown: boolean;
  checkBoxMap: HierarchicalCheckboxValueMap;
}

interface Dialog {
  sampleInput: React.RefObject<HTMLInputElement>;
}

class Dialog extends Component<unknown, DialogState> {
  constructor(props: unknown) {
    super(props);

    this.sampleInput = React.createRef();

    this.handleUpdateCheckboxMap = this.handleUpdateCheckboxMap.bind(this);

    const parentA = [
      'Parent A',
      new Map([
        ['Child 1', true],
        ['Child 2', false],
      ]),
    ];

    const parentB = [
      'Parent B',
      new Map([
        ['Child 3', true],
        ['Child 4', false],
        ['Child 5', true],
        ['Child 6', false],
      ]),
    ];

    const leaf = ['Leaf Parent', true];

    this.state = {
      isShown: false,
      isPickerShown: false,
      checkBoxMap: new Map([parentA, parentB, leaf] as Iterable<
        readonly [string, Map<string, boolean>]
      >),
    };
  }

  handleUpdateCheckboxMap(checkBoxMap: HierarchicalCheckboxValueMap): void {
    this.setState({
      checkBoxMap,
    });
  }

  renderChild(): React.ReactElement {
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
            Help text for a form input
          </small>
        </div>
      </div>
    );
  }

  render(): React.ReactElement {
    const { isShown, isPickerShown, checkBoxMap } = this.state;

    return (
      <SampleSection name="dialog">
        <h2 className="ui-title">Popover Dialog</h2>
        <p>
          Popover dialog that can contain interactive elements, can be set to
          self close on blur.
        </p>
        <Button
          kind="primary"
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
              if (this.sampleInput.current) {
                this.sampleInput.current.focus();
              }
            }}
            onExited={() => {
              this.setState({ isShown: false });
            }}
            closeOnBlur // if you want dialog to self close, on click outside
            interactive // if popper contents will be interactable
          >
            {this.renderChild()}
          </Popper>
        </Button>
        <Button
          kind="primary"
          style={{ marginBottom: '1rem', marginRight: '1rem' }}
          onClick={() => {
            this.setState(prevState => ({
              isPickerShown: !prevState.isPickerShown,
            }));
          }}
        >
          Open Dialog with Picker
          <Popper
            options={{ placement: 'bottom' }}
            isShown={isPickerShown}
            onExited={() => {
              this.setState({ isPickerShown: false });
            }}
            closeOnBlur
            interactive
            containPortals
          >
            <div className="p-3">
              <h4>Sample Picker</h4>
              <Picker label="Fruit">
                <Item key="apple">Apple</Item>
                <Item key="banana">Banana</Item>
                <Item key="cherry">Cherry</Item>
              </Picker>
              <Flex direction="column" marginTop="size-100">
                <SpectrumCheckbox defaultSelected>Ripe</SpectrumCheckbox>
                <SpectrumCheckbox>Organic</SpectrumCheckbox>
                <SpectrumCheckbox>Seedless</SpectrumCheckbox>
              </Flex>
            </div>
          </Popper>
        </Button>
        <p>
          A popover dialog can also contain Spectrum overlay components such as
          a Picker. The Picker&apos;s own popover should render above the
          dialog.
        </p>
        <p>
          The Hierarchical Checkbox Menu uses a popover dialog to display
          hierarchical groups of checkboxes.
        </p>

        <HierarchicalCheckboxMenu
          menuText="Checkbox Menu"
          valueMap={checkBoxMap}
          onUpdateValueMap={this.handleUpdateCheckboxMap}
        />
      </SampleSection>
    );
  }
}

export default Dialog;
