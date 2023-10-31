import React from 'react';
import { render } from '@testing-library/react';
import type { Container } from '@deephaven/golden-layout';
import PanelContextMenu from './PanelContextMenu';

function makeGlComponent({
  on = jest.fn(),
  off = jest.fn(),
  emit = jest.fn(),
  unbind = jest.fn(),
  trigger = jest.fn(),
} = {}) {
  return { on, off, emit, unbind, trigger };
}

function mountPanelContextMenu() {
  return render(
    <PanelContextMenu glContainer={makeGlComponent() as unknown as Container} />
  );
}

it('mounts and unmounts without crashing', () => {
  mountPanelContextMenu();
});
