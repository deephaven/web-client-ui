import React from 'react';
import { shallow } from 'enzyme';
import ConsolePanel from './ConsolePanel';

function makeStorageMock() {
  const storage = {};

  return {
    setItem: jest.fn((key, value) => {
      storage[key] = value || '';
    }),
    getItem: jest.fn(key => (key in storage ? storage[key] : null)),
  };
}

// mock the require that monaco should add
window.require = jest.fn();
window.localStorage = makeStorageMock();

it('renders without crashing', () => {
  const eventHub = { emit: () => {}, on: () => {}, off: () => {} };
  const container = { emit: () => {}, on: () => {}, off: () => {} };
  const wrapper = shallow(
    <ConsolePanel glEventHub={eventHub} glContainer={container} />
  );
  wrapper.unmount();
});
