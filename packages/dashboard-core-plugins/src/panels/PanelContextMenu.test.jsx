import React from 'react';
import { render } from '@testing-library/react';
import PanelContextMenu from './PanelContextMenu';

function makeGlComponent() {
  return {};
}

function mountPanelContextMenu() {
  return render(
    <PanelContextMenu
      title="test"
      onRename={() => {}}
      glContainer={makeGlComponent()}
    />
  );
}

it('mounts and unmounts without crashing', () => {
  mountPanelContextMenu();
});
