import React from 'react';
import { mount } from 'enzyme';
import { PanelManager } from '../panels';
import LinkerOverlayContent from './LinkerOverlayContent';

const LINKER_OVERLAY_MESSAGE = 'TEST_MESSAGE';

function makeEventHub() {
  const callbacks = {};
  return {
    on: jest.fn((eventName, callback) => {
      callbacks[eventName] = callback;
    }),
    emit: jest.fn((eventName, arg) => {
      callbacks[eventName](arg);
    }),
    off: jest.fn(eventName => {
      delete callbacks[eventName];
    }),
  };
}

function makeLayout() {
  return { eventHub: makeEventHub() };
}

function makePanelManager(layout = makeLayout()) {
  return new PanelManager(layout);
}

function mountOverlay({
  links = [],
  messageText = LINKER_OVERLAY_MESSAGE,
  onLinkDeleted = jest.fn(),
  onAllLinksDeleted = jest.fn(),
  onCancel = jest.fn(),
  onDone = jest.fn(),
  panelManager = makePanelManager(),
} = {}) {
  return mount(
    <LinkerOverlayContent
      links={links}
      messageText={messageText}
      onLinkDeleted={onLinkDeleted}
      onAllLinksDeleted={onAllLinksDeleted}
      onCancel={onCancel}
      onDone={onDone}
      panelManager={panelManager}
    />
  );
}

it('mounts and unmounts LinkerOverlay without crashing', () => {
  const wrapper = mountOverlay();
  wrapper.unmount();
});
