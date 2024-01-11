/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/style-prop-object */
import React, { Fragment, useCallback, useState } from 'react';
import {
  ActionButton,
  Button,
  Checkbox,
  ComboBox,
  Flex,
  Grid,
  Item,
  Picker,
  Radio,
  RadioGroup,
  SpectrumButtonProps,
  TextField,
  View,
} from '@adobe/react-spectrum';
import {
  Button as BootstrapButtonOld,
  Checkbox as CheckboxOld,
  ComboBox as ComboBoxOld,
  RadioGroup as RadioGroupOld,
  RadioItem,
  Select,
} from '@deephaven/components';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import {
  SAMPLE_SECTION_E2E_IGNORE,
  SPECTRUM_COMPARISON_SAMPLES_ID,
} from './constants';
import { sampleSectionIdAndClasses } from './utils';

type BootstrapLevel = 'primary' | 'secondary' | 'danger';

const buttons: [BootstrapLevel, SpectrumButtonProps['variant']][] = [
  ['primary', 'accent'],
  ['secondary', 'primary'],
  ['danger', 'negative'],
];

const options = [
  { title: 'One', value: '1' },
  { title: 'Two', value: '2' },
  { title: 'Three', value: '3' },
];

export function SpectrumComparison(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('1');

  const handleRadioChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRadioValue(event.target.value);
    },
    []
  );

  return (
    <div
      {...sampleSectionIdAndClasses(SPECTRUM_COMPARISON_SAMPLES_ID, [
        SAMPLE_SECTION_E2E_IGNORE,
      ])}
    >
      <h2 className="ui-title" data-no-menu>
        Bootstrap / Spectrum Comparison
      </h2>
      <Flex gap={20} wrap>
        <View>
          <h3>Buttons - Filled</h3>
          <Grid gap={20} columns="repeat(2, 120px)" autoRows="40x">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {buttons.map(([level, variant]) => (
              <Fragment key={level}>
                <BootstrapButtonOld onClick={EMPTY_FUNCTION} kind={level}>
                  Button
                </BootstrapButtonOld>

                <Button variant={variant} style="fill">
                  Button
                </Button>
              </Fragment>
            ))}

            <BootstrapButtonOld
              onClick={EMPTY_FUNCTION}
              kind="primary"
              disabled
            >
              Disabled
            </BootstrapButtonOld>
            <Button variant="accent" style="fill" isDisabled>
              Disabled
            </Button>
          </Grid>
        </View>

        <View>
          <h3>Buttons - Outline</h3>
          <Grid gap={20} columns="repeat(2, 120px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {buttons.map(([level, variant]) => (
              <Fragment key={level}>
                <BootstrapButtonOld onClick={EMPTY_FUNCTION} kind={level}>
                  {level}
                </BootstrapButtonOld>
                <Button variant={variant} style="outline">
                  {variant}
                </Button>
              </Fragment>
            ))}

            <BootstrapButtonOld
              onClick={EMPTY_FUNCTION}
              kind="secondary"
              disabled
            >
              Disabled
            </BootstrapButtonOld>
            <Button variant="primary" style="outline" isDisabled>
              Disabled
            </Button>
          </Grid>
        </View>

        <View>
          <h3>Action Buttons</h3>

          <Grid gap={20} columns="repeat(2, 120px)" autoRows="40x">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            <BootstrapButtonOld onClick={EMPTY_FUNCTION} kind="inline">
              Inline
            </BootstrapButtonOld>
            <ActionButton>Action</ActionButton>

            <BootstrapButtonOld onClick={EMPTY_FUNCTION} kind="inline" disabled>
              Disabled
            </BootstrapButtonOld>
            <ActionButton isDisabled>Disabled</ActionButton>
          </Grid>
        </View>

        <View>
          <h3>Pickers</h3>
          <Grid gap={20} columns="repeat(2, 192px)" autoRows="40x">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {[false, true].map(isDisabled => (
              <Fragment key={String(isDisabled)}>
                <div>
                  <label className="input-label">
                    {isDisabled ? 'Disabled ' : ''}Combobox
                  </label>
                  <ComboBoxOld
                    disabled={isDisabled}
                    options={options}
                    defaultValue="One"
                  />
                </div>

                <ComboBox
                  isDisabled={isDisabled}
                  label={isDisabled ? 'Disabled Combobox' : 'Combobox'}
                  inputValue="One"
                >
                  <Item key="1">One</Item>
                  <Item key="2">Two</Item>
                  <Item key="3">Three</Item>
                </ComboBox>
              </Fragment>
            ))}

            {[false, true].map(isDisabled => (
              <Fragment key={String(isDisabled)}>
                <div>
                  <label className="input-label">Select</label>
                  <Select
                    disabled={isDisabled}
                    placeholder="Select"
                    onChange={_v => {
                      // no-op
                    }}
                    className="custom-select"
                  >
                    <option disabled value="0">
                      {isDisabled ? '' : 'Disabled '}Select
                    </option>
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                  </Select>
                </div>
                <Picker
                  isDisabled={isDisabled}
                  label={isDisabled ? 'Disabled Picker' : 'Picker'}
                  placeholder="Picker"
                >
                  <Item key="1">One</Item>
                  <Item key="2">Two</Item>
                  <Item key="3">Three</Item>
                </Picker>
              </Fragment>
            ))}
          </Grid>
        </View>

        <View>
          <h3>Text Field</h3>
          <Grid gap={20} columns="repeat(2, 192px)" autoRows="40x">
            <label>Bootstrap</label>
            <label>Spectrum</label>
            <div>
              <label className="input-label">type=text</label>
              <input
                type="text"
                className="form-control"
                placeholder="Text Input"
              />
            </div>
            <TextField type="text" label="TextField" />

            <div>
              <label className="input-label">Disabled</label>
              <input
                type="text"
                className="form-control"
                disabled
                value="Disabled"
              />
            </div>
            <TextField
              type="text"
              label="Disabled"
              isDisabled
              value="Disabled"
            />
          </Grid>
        </View>

        <View>
          <h3>Checkbox</h3>
          <Grid gap={20} columns="repeat(2, 120px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            <CheckboxOld
              className="form-group"
              checked={isChecked}
              onChange={() => setIsChecked(v => !v)}
            >
              Checkbox
            </CheckboxOld>
            <Checkbox>Checkbox</Checkbox>

            <CheckboxOld
              className="form-group"
              disabled
              checked={isChecked}
              onChange={() => setIsChecked(v => !v)}
            >
              Disabled
            </CheckboxOld>
            <Checkbox isDisabled>Disabled</Checkbox>

            <Flex direction="column">
              <label>
                Radio Group
                <RadioGroupOld onChange={handleRadioChange} value={radioValue}>
                  <RadioItem value="1">One</RadioItem>
                  <RadioItem value="2">Two</RadioItem>
                  <RadioItem value="3">Three</RadioItem>
                </RadioGroupOld>
              </label>
            </Flex>

            <RadioGroup
              label="Radio Group"
              value={radioValue}
              onChange={setRadioValue}
            >
              <Radio value="1">One</Radio>
              <Radio value="2">Two</Radio>
              <Radio value="3">Three</Radio>
            </RadioGroup>
          </Grid>
        </View>
      </Flex>
    </div>
  );
}

export default SpectrumComparison;
