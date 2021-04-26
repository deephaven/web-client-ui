import React, { useState } from 'react';
import PropTypes from 'prop-types';
import shortid from 'shortid';
import RadioItem from './RadioItem';

/**
 * A group of radio buttons. Use with RadioItems to populate, eg.
 * <RadioGroup>
 *   <RadioItem .../>
 *   <RadioItem .../>
 * </RadioGroup>
 */
const RadioGroup = props => {
  const { children, disabled, name: propsName, onChange, value } = props;
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
            })
          : null
      )}
    </>
  );
};

RadioGroup.propTypes = {
  /** The radio items to populate this radio. Should be of type RadioItem. */
  children: {
    isRequired(props, propName, componentName) {
      const children = props[propName];

      if (children === undefined) {
        return new Error(
          `'${componentName}' should have children of type RadioItem, but was undefined.`
        );
      }

      let error = null;
      React.Children.forEach(children, child => {
        if (child && child.type !== RadioItem) {
          error = new Error(
            `'${componentName}' children should be of type RadioItem.`
          );
        }
      });
      return error;
    },
  }.isRequired,

  /** The name to use for the radio items. If not specified, a name is automatically generated */
  name: PropTypes.string,

  /** Triggered when a radio button is changed */
  onChange: PropTypes.func.isRequired,

  /** The currently selected value. Will automatically set the `checked` attribute of the RadioItem. */
  value: PropTypes.string,

  disabled: PropTypes.bool,
};

RadioGroup.defaultProps = {
  name: null,
  value: '',
  disabled: false,
};

export default RadioGroup;
