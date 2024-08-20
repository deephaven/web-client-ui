/* eslint-disable react/style-prop-object */
import React, { Fragment, useState } from 'react';
import {
  ActionButton,
  Button,
  Checkbox,
  Flex,
  Grid,
  Icon,
  Item,
  Picker,
  SpectrumButtonProps,
  TextField,
} from '@adobe/react-spectrum';
import {
  Button as BootstrapButtonOld,
  Checkbox as CheckboxOld,
  Select,
  View,
  Text,
} from '@deephaven/components';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { vsPlay } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  SAMPLE_SECTION_E2E_IGNORE,
  SPECTRUM_COMPARISON_SAMPLES_ID,
} from './constants';
import SampleSection from './SampleSection';

type BootstrapLevel = 'primary' | 'secondary' | 'danger';

const buttons: [BootstrapLevel, SpectrumButtonProps['variant']][] = [
  ['primary', 'accent'],
  ['secondary', 'primary'],
  ['danger', 'negative'],
];

export function SpectrumComparison(): JSX.Element {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <SampleSection
      name={SPECTRUM_COMPARISON_SAMPLES_ID}
      className={SAMPLE_SECTION_E2E_IGNORE}
    >
      <h2 className="ui-title" data-no-menu>
        Bootstrap / Spectrum Comparison
      </h2>
      <Flex gap={20} wrap>
        <View>
          <h3>Buttons - Filled</h3>
          <Grid
            gap={20}
            columns="repeat(2, 120px)"
            autoRows="40x"
            justifyItems="start"
            alignItems="start"
          >
            <label>Bootstrap</label>
            <label>Spectrum</label>

            {buttons.map(([level, variant]) => (
              <Fragment key={level}>
                <BootstrapButtonOld
                  onClick={EMPTY_FUNCTION}
                  kind={level}
                  icon={vsPlay}
                >
                  Button
                </BootstrapButtonOld>

                <Button variant={variant} style="fill">
                  <Icon>
                    <FontAwesomeIcon icon={vsPlay} />
                  </Icon>
                  <Text>Button</Text>
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
          </Grid>
        </View>
      </Flex>
    </SampleSection>
  );
}

export default SpectrumComparison;
