import React from 'react';
import { Editor } from '@deephaven/console';
import Constants from './StyleConstants';

export default {
  title: 'Editors',
  component: Editor,
};

const Template = args => (
  <div>
    <Editor {...args} />
  </div>
);

export const Python = Template.bind({});
Python.args = {
  settings: {
    language: 'python',
    value: Constants.testPython,
  },
};

export const Groovy = Template.bind({});
Groovy.args = {
  settings: {
    language: 'groovy',
    value: Constants.testGroovy,
  },
};
