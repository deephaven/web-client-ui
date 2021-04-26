import React from 'react';
import './ExampleComponent.scss';

interface ExampleComponentProps {
  text?: string;
}

const ExampleComponent = ({ text }: ExampleComponentProps): JSX.Element => (
  <div className="example-component">{text}</div>
);

ExampleComponent.defaultProps = {
  text: 'Hello World!',
};

export default ExampleComponent;
