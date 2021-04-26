import React from 'react';
import { mount } from 'enzyme';
import PanelContextMenu from './PanelContextMenu';

function makeGlComponent() {
  return {};
}

function mountPanelContextMenu() {
  return mount(
    <PanelContextMenu
      title="test"
      onRename={() => {}}
      glContainer={makeGlComponent()}
    />
  );
}

it('mounts and unmounts without crashing', () => {
  const wrapper = mountPanelContextMenu();
  wrapper.unmount();
});
