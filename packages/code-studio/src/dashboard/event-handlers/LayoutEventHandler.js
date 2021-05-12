import Log from '@deephaven/log';
import LayoutUtils from '../../layout/LayoutUtils';
import { PanelEvent } from '../events';

const log = Log.module('LayoutEventHandler');

/**
 * Handles Layout events
 */
class LayoutEventHandler {
  static updateComponentCss(item) {
    if (!item || !item.config || !item.config.component || !item.element) {
      return;
    }

    const cssComponent = item.config.component
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    const cssClass = `${cssComponent}-component`;
    item.element.addClass(cssClass);
  }

  static handleComponentCreated(item) {
    log.debug2('handleComponentCreated', item);

    LayoutEventHandler.updateComponentCss(item);
  }

  constructor(layout, dehydrateComponent, onLayoutChange) {
    this.handleLayoutStateChanged = this.handleLayoutStateChanged.bind(this);
    this.handleLayoutItemPickedUp = this.handleLayoutItemPickedUp.bind(this);
    this.handleLayoutItemDropped = this.handleLayoutItemDropped.bind(this);

    this.layout = layout;
    this.dehydrateComponent = dehydrateComponent;
    this.onLayoutChange = onLayoutChange;

    this.isItemDragging = false;

    this.updateLayoutCss();
    this.startListening();
  }

  handleLayoutItemPickedUp() {
    this.isItemDragging = true;
  }

  handleLayoutItemDropped() {
    this.isItemDragging = false;
  }

  handleLayoutStateChanged() {
    // we don't want to emit stateChanges that happen during item drags or else
    // we risk the last saved state being one without that panel in the layout entirely
    if (this.isItemDragging) return;

    const glConfig = this.layout.toConfig();
    const contentConfig = glConfig.content;
    const dehydratedLayoutConfig = LayoutUtils.dehydrateLayoutConfig(
      contentConfig,
      this.dehydrateComponent
    );
    log.debug(
      'handleLayoutStateChanged',
      contentConfig,
      dehydratedLayoutConfig
    );

    this.onLayoutChange(dehydratedLayoutConfig);
  }

  updateLayoutCss() {
    const items = this.layout.root.getItemsByFilter(item => item.isComponent);
    for (let i = 0; i < items.length; i += 1) {
      LayoutEventHandler.updateComponentCss(items[i]);
    }
  }

  startListening() {
    this.layout.on('stateChanged', this.handleLayoutStateChanged);
    this.layout.on('itemPickedUp', this.handleLayoutItemPickedUp);
    this.layout.on('itemDropped', this.handleLayoutItemDropped);
    this.layout.on(
      'componentCreated',
      LayoutEventHandler.handleComponentCreated
    );
    this.layout.eventHub.on(
      PanelEvent.TITLE_CHANGED,
      this.handleLayoutStateChanged
    );
  }

  stopListening() {
    this.layout.off('stateChanged', this.handleLayoutStateChanged);
    this.layout.off('itemPickedUp', this.handleLayoutItemPickedUp);
    this.layout.off('itemDropped', this.handleLayoutItemDropped);
    this.layout.off(
      'componentCreated',
      LayoutEventHandler.handleComponentCreated
    );
    this.layout.eventHub.off(
      PanelEvent.TITLE_CHANGED,
      this.handleLayoutStateChanged
    );
  }
}

export default LayoutEventHandler;
