import $ from 'jquery';
import type { AbstractContentItem } from '../items';
import { isComponent } from '../items';
import type LayoutManager from '../LayoutManager';
import { DragListener } from '../utils';
import DragProxy from './DragProxy';
import type Header from './Header';

/**
 * Represents an individual tab within a Stack's header
 *
 * @param header
 * @param contentItem
 */
export default class Tab {
  /**
   * The tab's html template
   */
  private static _template = [
    '<li class="lm_tab">',
    '<span class="lm_title_before"></span>',
    '<span class="lm_title"></span>',
    '<div class="lm_close_tab"></div>',
    '</li>',
  ].join('');

  header: Header;
  contentItem: AbstractContentItem;
  element = $(Tab._template);
  titleElement: JQuery<HTMLElement>;
  closeElement: JQuery<HTMLElement>;
  isActive = false;

  private _layoutManager: LayoutManager;
  private _dragListener?: DragListener;

  constructor(header: Header, contentItem: AbstractContentItem) {
    this.header = header;
    this.contentItem = contentItem;
    this.titleElement = this.element.find('.lm_title');
    this.closeElement = this.element.find('.lm_close_tab');
    this.closeElement[contentItem.config.isClosable ? 'show' : 'hide']();

    this.setTitle(contentItem.config.title);
    this.contentItem.on('titleChanged', this.setTitle, this);

    this._layoutManager = this.contentItem.layoutManager;

    if (
      this._layoutManager.config.settings?.reorderEnabled &&
      contentItem.config.reorderEnabled
    ) {
      this._dragListener = new DragListener(this.element);
      this._dragListener.on('dragStart', this._onDragStart, this);
      this.contentItem.on(
        'destroy',
        this._dragListener.destroy,
        this._dragListener
      );
    }

    this._onTabClick = this._onTabClick.bind(this);
    this._onCloseClick = this._onCloseClick.bind(this);
    this._onTabContentFocusIn = this._onTabContentFocusIn.bind(this);
    this._onTabContentFocusOut = this._onTabContentFocusOut.bind(this);

    this.element.on('click', this._onTabClick);
    this.element.on('auxclick', this._onTabClick);

    if (this.contentItem.config.isClosable) {
      this.closeElement.on('click', this._onCloseClick);
      this.closeElement.on('mousedown', this._onCloseMousedown);
    } else {
      this.closeElement.remove();
    }

    this.contentItem.tab = this;
    this.contentItem.emit('tab', this);
    this.contentItem.layoutManager.emit('tabCreated', this);

    if (isComponent(this.contentItem)) {
      // add focus class to tab when content
      this.contentItem.container._contentElement
        .on('focusin', this._onTabContentFocusIn)
        .on('focusout', this._onTabContentFocusOut);
      this.contentItem.container._contentElement[0].addEventListener(
        'click',
        this._onTabContentFocusIn,
        true // capture, so it occurs before onClick from react events
      );

      this.contentItem.container.tab = this;
      this.contentItem.container.emit('tab', this);
    }
  }

  /**
   * Sets the tab's title to the provided string and sets
   * its title attribute to a pure text representation (without
   * html tags) of the same string.
   * @param title can contain html
   */
  setTitle(title = '') {
    // Disabling for illumon project, we want to manage our own tooltips
    // this.element.attr( 'title', lm.utils.stripTags( title ) );
    this.titleElement.html(title);
  }

  /**
   * Sets this tab's active state. To programmatically
   * switch tabs, use header.setActiveContentItem( item ) instead.
   * @param isActive
   */
  setActive(isActive: boolean) {
    if (isActive === this.isActive) {
      return;
    }
    this.isActive = isActive;

    if (isActive) {
      this.element.addClass('lm_active');
    } else {
      this.element.removeClass('lm_active');
    }
  }

  /**
   * Destroys the tab
   *
   * @private
   * @returns {void}
   */
  _$destroy() {
    this.element.off('click', this._onTabClick);
    this.element.off('auxclick', this._onTabClick);
    this.closeElement.off('click', this._onCloseClick);
    if (isComponent(this.contentItem)) {
      this.contentItem.container._contentElement.off();
      this.contentItem.container._contentElement[0].removeEventListener(
        'click',
        this._onTabContentFocusIn,
        true
      );
    }
    if (this._dragListener) {
      this.contentItem.off(
        'destroy',
        this._dragListener.destroy,
        this._dragListener
      );
      this._dragListener.off('dragStart', this._onDragStart);
      this._dragListener = undefined;
    }
    this.element.remove();
  }

  /**
   * Callback for the DragListener
   *
   * @param x The tabs absolute x position
   * @param y The tabs absolute y position
   */
  _onDragStart(x: number, y: number) {
    if (this.contentItem.parent?.isMaximised) {
      this.contentItem.parent.toggleMaximise();
    }

    if (!this._dragListener) {
      return;
    }

    new DragProxy(
      x,
      y,
      this._dragListener,
      this._layoutManager,
      this.contentItem,
      this.header.parent
    );
  }

  /**
   * Callback when the contentItem is focused in
   *
   * Why [0].focus():
   * https://github.com/jquery/jquery/commit/fe5f04de8fde9c69ed48283b99280aa6df3795c7
   * From jquery source: "If this is an inner synthetic event for an event with a bubbling surrogate (focus or blur),
   * assume that the surrogate already propagated from triggering the native event and prevent that from happening
   * again here. This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the bubbling surrogate
   * propagates *after* the non-bubbling base), but that seems less bad than duplication."
   */
  _onTabContentFocusIn() {
    if (
      isComponent(this.contentItem) &&
      !this.contentItem.container._contentElement[0].contains(
        document.activeElement
      )
    ) {
      // jquery 3.4.0 and later, jquery method optimizes out the focus from
      // happening in proper order. Can use HTMLElement.focus() to avoid.
      this.contentItem.container._contentElement[0].focus(); // [0] needed to use dom focus, not jquery method
    }
    this.element.addClass('lm_focusin');
  }

  /**
   * Callback when the contentItem is focused out
   *
   * @param {jQuery DOM event} event
   *
   * @private
   * @returns {void}
   */
  _onTabContentFocusOut() {
    if (
      isComponent(this.contentItem) &&
      !this.contentItem.container._contentElement[0].contains(
        document.activeElement
      )
    ) {
      this.element.removeClass('lm_focusin');
    }
  }

  /**
   * Callback when the tab is clicked
   *
   * @param event
   */
  _onTabClick(event?: JQuery.TriggeredEvent) {
    // left mouse button or tap
    if (!event || event.button === 0) {
      var activeContentItem = this.header.parent.getActiveContentItem();
      if (
        this.contentItem !== activeContentItem &&
        isComponent(this.contentItem)
      ) {
        this.header.parent.setActiveContentItem(this.contentItem);
      } else if (
        isComponent(this.contentItem) &&
        !this.contentItem.container._contentElement[0].contains(
          document.activeElement
        )
      ) {
        // if no focus inside put focus onto the container
        // so focusin always fires for tabclicks
        this.contentItem.container._contentElement.focus();
      }

      if (isComponent(this.contentItem)) {
        this.contentItem.container.emit('tabClicked', event);
      }

      // might have been called from the dropdown
      this.header._hideAdditionalTabsDropdown();

      // makes sure clicked tabs scrollintoview (either those partially offscreen or in dropdown)
      this.element.get(0)?.scrollIntoView({
        inline: 'nearest',
        // behaviour smooth is not possible here, as when a tab becomes active it may attempt to take focus
        // which interupts any scroll behaviour from completeting
      });

      // middle mouse button
    } else if (event.button === 1 && this.contentItem.config.isClosable) {
      this._onCloseClick(event);
    }
  }

  /**
   * Callback when the tab's close button is
   * clicked
   *
   * @param event
   */
  _onCloseClick(event: JQuery.TriggeredEvent) {
    event.stopPropagation();
    if (isComponent(this.contentItem)) {
      this.contentItem.container.close();
    } else {
      this.header.parent.removeChild(this.contentItem);
    }
  }

  /**
   * Callback to capture tab close button mousedown
   * to prevent tab from activating.
   *
   * @param event
   */
  _onCloseMousedown(event: Event) {
    event.stopPropagation();
  }
}
