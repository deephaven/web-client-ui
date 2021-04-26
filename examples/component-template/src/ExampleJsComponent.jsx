import React from 'react';
import PropTypes from 'prop-types';
import './ExampleComponent.scss';

const ExampleComponent = ({ text }) => (
  <div className="example-component">Your text: {text}</div>
);

ExampleComponent.propTypes = {
  text: PropTypes.string,
};

ExampleComponent.defaultProps = {
  text: 'Hello World!',
};

export default ExampleComponent;
