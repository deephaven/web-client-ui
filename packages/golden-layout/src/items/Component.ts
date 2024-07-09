import $ from 'jquery';
import AbstractContentItem from './AbstractContentItem';
import { ConfigurationError } from '../errors';
import type LayoutManager from '../LayoutManager';
import type { ComponentConfig } from '../config/ItemConfig';
import ItemContainer from '../container/ItemContainer';
import type { ComponentConstructor } from '../LayoutManager';

/**
 * @param layoutManager
 * @param config
 * @param parent
 */
export default class Component extends AbstractContentItem {
  config: ComponentConfig;

  componentName: string;

  container: ItemContainer;

  parent: AbstractContentItem | null;

  instance: unknown;

  constructor(
    layoutManager: LayoutManager,
    config: ComponentConfig,
    parent: AbstractContentItem | null
  ) {
    // Extend before super so the AbstractContentItem defualts aren't applied first
    Object.entries(
      layoutManager.config.settings.defaultComponentConfig ?? {}
    ).forEach(([k, v]) => {
      // @ts-ignore
      if (config[k] === undefined) {
        // @ts-ignore
        config[k] = v;
      }
    });
    super(layoutManager, config, parent, $());
    this.config = config;
    this.parent = parent;

    const ComponentConstructor =
        (layoutManager.getComponent(
          this.config.componentName
        ) as ComponentConstructor) || layoutManager.getFallbackComponent(),
      componentConfig = $.extend(true, {}, this.config.componentState || {});

    if (ComponentConstructor == null) {
      throw new ConfigurationError(
        'Unknown component "' + this.config.componentName + '"'
      );
    }
    componentConfig.componentName = this.config.componentName;
    this.componentName = this.config.componentName;

    if (this.config.title === '') {
      this.config.title = this.config.componentName;
    }

    this.isComponent = true;
    this.container = new ItemContainer(this.config, this, layoutManager);
    this.instance = new ComponentConstructor(this.container, componentConfig);
    this.element = this.container._element;
  }

  close() {
    this.parent?.removeChild(this);
  }

  setSize() {
    if (this.element.is(':visible')) {
      // Do not update size of hidden components to prevent unwanted reflows
      this.container._$setSize(this.element.width(), this.element.height());
    }
  }

  _$init() {
    AbstractContentItem.prototype._$init.call(this);
    this.container.emit('open');
  }

  _$hide() {
    this.container.hide();
    AbstractContentItem.prototype._$hide.call(this);
  }

  _$show() {
    this.container.show();
    if (this.container._config.isFocusOnShow) {
      // focus the shown container element on show
      // preventScroll isn't supported in safari, but also doesn't matter for illumon when 100% window
      this.container._contentElement[0].focus({ preventScroll: true });
    }
    AbstractContentItem.prototype._$show.call(this);
  }

  _$destroy() {
    this.container.emit('destroy', this);
    AbstractContentItem.prototype._$destroy.call(this);
  }

  /**
   * Dragging onto a component directly is not an option
   *
   * @returns null
   */
  _$getArea() {
    return null;
  }
}
