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
  ButtonOld,
  Checkbox as CheckboxOld,
  ComboBox as ComboBoxOld,
  RadioGroup as RadioGroupOld,
  RadioItem,
  Select,
} from '@deephaven/components';
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
          <Grid gap={20} columns="repeat(2, 120px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {buttons.map(([level, variant]) => (
              <Fragment key={level}>
                <ButtonOld className={`btn-${level}`}>{level}</ButtonOld>
                <Button variant={variant} style="fill">
                  {variant}
                </Button>
              </Fragment>
            ))}

            <ButtonOld className="btn-primary" disabled>
              Disabled
            </ButtonOld>
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
                <ButtonOld className={`btn-outline-${level}`}>
                  {level}
                </ButtonOld>
                <Button variant={variant} style="outline">
                  {variant}
                </Button>
              </Fragment>
            ))}

            <ButtonOld className="btn-outline-primary" disabled>
              Disabled
            </ButtonOld>
            <Button variant="primary" style="outline" isDisabled>
              Disabled
            </Button>
          </Grid>
        </View>

        <View>
          <h3>Action Buttons</h3>

          <Grid gap={20} columns="repeat(2, 120px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            <ButtonOld className="btn-inline mx-2">Inline</ButtonOld>
            <ActionButton>Action</ActionButton>

            <ButtonOld className="btn-inline mx-2" disabled>
              Disabled
            </ButtonOld>
            <ActionButton isDisabled>Disabled</ActionButton>
          </Grid>
        </View>

        <View>
          <h3>Pickers</h3>
          <Grid gap={20} columns="repeat(2, 192px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {[false, true].map(isDisabled => (
              <Fragment key={String(isDisabled)}>
                <label>
                  {isDisabled ? 'Disabled ' : ''}Combobox
                  <ComboBoxOld disabled={isDisabled} options={options} />
                </label>

                <ComboBox
                  isDisabled={isDisabled}
                  label={isDisabled ? 'Disabled Combobox' : 'Combobox'}
                >
                  <Item key="1">One</Item>
                  <Item key="2">Two</Item>
                  <Item key="3">Three</Item>
                </ComboBox>
              </Fragment>
            ))}

            {[false, true].map(isDisabled => (
              <Fragment key={String(isDisabled)}>
                <label>
                  Select
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
                </label>

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
          <Grid gap={20} columns="repeat(2, 192px)">
            <label>Bootstrap</label>
            <label>Spectrum</label>
            <label>
              type=text
              <input
                type="text"
                className="form-control"
                placeholder="Text Input"
              />
            </label>
            <TextField type="text" label="TextField" />

            <label>
              Disabled
              <input
                type="text"
                className="form-control"
                disabled
                value="Disabled"
              />
            </label>
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
