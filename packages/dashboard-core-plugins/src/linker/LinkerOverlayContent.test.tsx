import React from 'react';
import { mount } from 'enzyme';
import { PanelManager } from '@deephaven/dashboard';
import GoldenLayout from '@deephaven/golden-layout';
import LinkerOverlayContent from './LinkerOverlayContent';

const LINKER_OVERLAY_MESSAGE = 'TEST_MESSAGE';

function makeLayout() {
  return new GoldenLayout({});
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
