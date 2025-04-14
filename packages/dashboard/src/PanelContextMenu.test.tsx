import React from 'react';
import { render } from '@testing-library/react';
import { EventEmitter, type Container } from '@deephaven/golden-layout';
import { createMockStore } from '@deephaven/redux';
import { ApiContext } from '@deephaven/jsapi-bootstrap';
import dh from '@deephaven/jsapi-shim';
import { Provider } from 'react-redux';
import PanelContextMenu from './PanelContextMenu';

function makeGlComponent({
  on = jest.fn(),
  off = jest.fn(),
  emit = jest.fn(),
  unbind = jest.fn(),
  trigger = jest.fn(),
  layoutManager = {
    root: {},
  },
  getConfig = jest.fn(),
} = {}) {
  return { on, off, emit, unbind, trigger, layoutManager, getConfig };
}

function mountPanelContextMenu() {
  const store = createMockStore();
  return render(
    <ApiContext.Provider value={dh}>
      <Provider store={store}>
        <PanelContextMenu
          glContainer={makeGlComponent() as unknown as Container}
          glEventHub={new EventEmitter()}
        />
      </Provider>
    </ApiContext.Provider>
  );
}

it('mounts and unmounts without crashing', () => {
  mountPanelContextMenu();
});
