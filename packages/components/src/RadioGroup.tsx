import React, { useState } from 'react';
import shortid from 'shortid';

type RadioGroupProps = {
  /** The radio items to populate this radio. Should be of type RadioItem. */
  children?: React.ReactElement | React.ReactElement[];

  /** The name to use for the radio items. If not specified, a name is automatically generated */
  name?: string;

  /** Triggered when a radio button is changed */
  onChange: React.ChangeEventHandler<HTMLInputElement>;

  /** The currently selected value. Will automatically set the `checked` attribute of the RadioItem. */
  value?: string;

  disabled?: boolean;
  'data-testid'?: string;
};

/**
 * A group of radio buttons. Use with RadioItems to populate, eg.
 * <RadioGroup>
 *   <RadioItem .../>
 *   <RadioItem .../>
 * </RadioGroup>
 */
const RadioGroup = (props: RadioGroupProps): JSX.Element => {
  const {
    children,
    disabled = false,
    name: propsName,
    onChange,
    value = '',
    'data-testid': dataTestId,
  } = props;
  const [name] = useState(propsName || shortid());

  // Need to use "text" type so we can apply a pattern and make selection properly
  return (
    <>
      {React.Children.map(children, child =>
        child
          ? React.cloneElement(child, {
              name,
              onChange: child.props.onChange || onChange,
              checked: value === child.props.value,
              disabled: child.props.disabled || disabled,
              'data-testid': dataTestId,
            })
          : null
      )}
    </>
  );
};

export default RadioGroup;
