import PropTypes from 'prop-types';

const nullableBoolean = (props: Record<string, unknown>, propName: string) =>
  props[propName] === null ? null : PropTypes.bool;

const nullableString = (props: Record<string, unknown>, propName: string) =>
  props[propName] === null ? null : PropTypes.string;

const CommonPropTypes = Object.freeze({ nullableBoolean, nullableString });

export default CommonPropTypes;
