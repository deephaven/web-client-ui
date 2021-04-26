import PropTypes from 'prop-types';

const nullableBoolean = (props, propName) =>
  props[propName] === null ? null : PropTypes.boolean;

const nullableString = (props, propName) =>
  props[propName] === null ? null : PropTypes.string;

const CommonPropTypes = Object.freeze({ nullableBoolean, nullableString });

export default CommonPropTypes;
