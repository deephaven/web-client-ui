import $ from 'jquery';
import AbstractContentItem, { isComponent } from './AbstractContentItem';
import type LayoutManager from '../LayoutManager';
import type { ComponentConfig, ItemConfigType } from '../config';
import { Header } from '../controls';
import type RowOrColumn from './RowOrColumn';

interface HoverDimensions {
  hoverArea: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  highlightArea: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

type ContentAreaDimensions = {
  header: HoverDimensions;
  body?: HoverDimensions;
  top?: HoverDimensions;
  bottom?: HoverDimensions;
  left?: HoverDimensions;
  right?: HoverDimensions;
};

type BodySegment = keyof ContentAreaDimensions;

export interface StackHeaderConfig {
  show?: boolean | 'top' | 'left' | 'right' | 'bottom';
  popout?: string;
  maximise?: string;
  close?: string;
  minimise?: string;
}

export default class Stack extends AbstractContentItem {
  private _activeContentItem: AbstractContentItem | null = null;

  _header: StackHeaderConfig;

  childElementContainer = $('<div class="lm_items"></div>');
  header: Header;
  parent: RowOrColumn;

  isStack = true;

  private _dropZones = {};
  private _dropSegment: string | null = null;
  _contentAreaDimensions: ContentAreaDimensions | null = null;
  private _dropIndex: number | undefined;
  _side: boolean | 'top' | 'left' | 'right' | 'bottom';
  _sided: boolean = false;

  config: ComponentConfig & {
    activeItemIndex?: number;
  };

  constructor(
    layoutManager: LayoutManager & {
      config: LayoutManager['config'] & {
        header?: StackHeaderConfig;
      };
    },
    config: ComponentConfig & {
      header?: StackHeaderConfig;
      hasHeaders?: boolean;
    },
    parent: RowOrColumn
  ) {
    super(
      layoutManager,
      config,
      parent,
      $('<div class="lm_item lm_stack"></div>')
    );
    this.parent = parent;
    this.config = config;

    const cfg = layoutManager.config;
    this._side = false;
    this._header = {
      // defaults' reconstruction from old configuration style
      show: cfg.settings?.hasHeaders && config.hasHeaders !== false,
      popout: cfg.settings?.showPopoutIcon ? cfg.labels?.popout : undefined,
      maximise: cfg.settings?.showMaximiseIcon
        ? cfg.labels?.maximise
        : undefined,
      close: cfg.settings?.showCloseIcon ? cfg.labels?.close : undefined,
      minimise: cfg.labels?.minimise ?? undefined,
    };

    // load simplified version of header configuration (https://github.com/deepstreamIO/golden-layout/pull/245)
    if (cfg.header) this._header = { ...this._header, ...cfg.header };
    if (config.header)
      // load from stack
      this._header = { ...this._header, ...config.header };
    if (config.content && config.content[0] && config.content[0].header)
      // load from component if stack omitted
      this._header = { ...this._header, ...config.content[0].header };

    this.header = new Header(layoutManager, this);

    this.element.append(this.header.element);
    this.element.append(this.childElementContainer);
    this._setupHeaderPosition();
    this._$validateClosability();
  }

  setSize() {
    var i,
      headerSize = this._header.show
        ? this.layoutManager.config.dimensions?.headerHeight ?? 0
        : 0,
      contentWidth =
        (this.element.width() ?? 0) - (this._sided ? headerSize : 0),
      contentHeight =
        (this.element.height() ?? 0) - (!this._sided ? headerSize : 0);

    this.childElementContainer.width(contentWidth);
    this.childElementContainer.height(contentHeight);

    for (i = 0; i < this.contentItems.length; i++) {
      this.contentItems[i].element.width(contentWidth).height(contentHeight);
    }
    this.emit('resize');
    this.emitBubblingEvent('stateChanged');
  }

  _$init() {
    if (this.isInitialised === true) return;

    this.header._attachWheelListener();

    super._$init();

    for (let i = 0; i < this.contentItems.length; i++) {
      this.header.createTab(this.contentItems[i]);
      this.contentItems[i]._$hide();
    }

    if (this.contentItems.length > 0) {
      const initialItem = this.contentItems[this.config.activeItemIndex || 0];

      if (!initialItem) {
        throw new Error('Configured activeItemIndex out of bounds');
      }

      this.setActiveContentItem(initialItem);
    }
  }

  setActiveContentItem(contentItem: AbstractContentItem) {
    if (this.contentItems.indexOf(contentItem) === -1) {
      throw new Error('contentItem is not a child of this stack');
    }

    if (this._activeContentItem !== null) {
      this._activeContentItem._$hide();
    }

    this._activeContentItem = contentItem;
    this.header.setActiveContentItem(contentItem);
    contentItem._$show();
    this.emit('activeContentItemChanged', contentItem);
    this.layoutManager.emit('activeContentItemChanged', contentItem);
    this.emitBubblingEvent('stateChanged');
  }

  getActiveContentItem() {
    return this.header.activeContentItem;
  }

  addChild(contentItem: AbstractContentItem | ItemConfigType, index?: number) {
    contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
    super.addChild(contentItem, index);
    this.childElementContainer.append(contentItem.element);
    this.header.createTab(contentItem, index);
    this.setActiveContentItem(contentItem);
    this.callDownwards('setSize');
    this._$validateClosability();
    this.emitBubblingEvent('stateChanged');
  }

  removeChild(contentItem: AbstractContentItem, keepChild = false) {
    var index = this.contentItems.indexOf(contentItem);
    super.removeChild(contentItem, keepChild);
    this.header.removeTab(contentItem);
    if (this.header.activeContentItem === contentItem) {
      if (this.contentItems.length > 0) {
        this.setActiveContentItem(this.contentItems[Math.max(index - 1, 0)]);
      } else {
        this._activeContentItem = null;
      }
    }

    this._$validateClosability();
    this.emitBubblingEvent('stateChanged');
  }

  /**
   * Validates that the stack is still closable or not. If a stack is able
   * to close, but has a non closable component added to it, the stack is no
   * longer closable until all components are closable.
   */
  _$validateClosability() {
    let isClosable = this.header._isClosable();

    for (let i = 0, len = this.contentItems.length; i < len; i++) {
      if (!isClosable) {
        break;
      }

      isClosable = this.contentItems[i].config.isClosable ?? false;
    }

    this.header._$setClosable(isClosable);
  }

  _$destroy() {
    AbstractContentItem.prototype._$destroy.call(this);
    this.header._$destroy();
  }

  /**
   * Ok, this one is going to be the tricky one: The user has dropped {contentItem} onto this stack.
   *
   * It was dropped on either the stacks header or the top, right, bottom or left bit of the content area
   * (which one of those is stored in this._dropSegment). Now, if the user has dropped on the header the case
   * is relatively clear: We add the item to the existing stack... job done (might be good to have
   * tab reordering at some point, but lets not sweat it right now)
   *
   * If the item was dropped on the content part things are a bit more complicated. If it was dropped on either the
   * top or bottom region we need to create a new column and place the items accordingly.
   * Unless, of course if the stack is already within a column... in which case we want
   * to add the newly created item to the existing column...
   * either prepend or append it, depending on wether its top or bottom.
   *
   * Same thing for rows and left / right drop segments... so in total there are 9 things that can potentially happen
   * (left, top, right, bottom) * is child of the right parent (row, column) + header drop
   *
   * @param contentItem
   */
  _$onDrop(contentItem: AbstractContentItem) {
    /*
     * The item was dropped on the header area. Just add it as a child of this stack and
     * get the hell out of this logic
     */
    if (this._dropSegment === 'header') {
      this._resetHeaderDropZone();
      this.addChild(contentItem, this._dropIndex);
      return;
    }

    /*
     * The stack is empty. Let's just add the element.
     */
    if (this._dropSegment === 'body') {
      this.addChild(contentItem);
      return;
    }

    /*
     * The item was dropped on the top-, left-, bottom- or right- part of the content. Let's
     * aggregate some conditions to make the if statements later on more readable
     */
    const isVertical =
      this._dropSegment === 'top' || this._dropSegment === 'bottom';
    const isHorizontal =
      this._dropSegment === 'left' || this._dropSegment === 'right';
    const insertBefore =
      this._dropSegment === 'top' || this._dropSegment === 'left';
    const hasCorrectParent =
      (isVertical && this.parent.isColumn) ||
      (isHorizontal && this.parent.isRow);
    const type = isVertical ? 'column' : 'row';
    const dimension = isVertical ? 'height' : 'width';

    /*
     * The content item can be either a component or a stack. If it is a component, wrap it into a stack
     */
    if (isComponent(contentItem)) {
      const stack = this.layoutManager.createContentItem(
        {
          type: 'stack',
          header: contentItem.config.header || {},
        },
        this
      );
      stack._$init();
      stack.addChild(contentItem);
      contentItem = stack;
    }

    /*
     * If the item is dropped on top or bottom of a column or left and right of a row, it's already
     * layd out in the correct way. Just add it as a child
     */
    if (hasCorrectParent) {
      const index = this.parent.contentItems.indexOf(this);
      this.parent.addChild(contentItem, insertBefore ? index : index + 1, true);
      this.config[dimension] = (this.config[dimension] ?? 0) * 0.5;
      contentItem.config[dimension] = this.config[dimension];
      this.parent.callDownwards('setSize');
      /*
       * This handles items that are dropped on top or bottom of a row or left / right of a column. We need
       * to create the appropriate contentItem for them to live in
       */
    } else {
      const rowOrColumn = this.layoutManager.createContentItem(
        { type: type },
        this
      ) as RowOrColumn;
      this.parent.replaceChild(this, rowOrColumn);

      rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
      rowOrColumn.addChild(this, insertBefore ? undefined : 0, true);

      this.config[dimension] = 50;
      contentItem.config[dimension] = 50;
      rowOrColumn.callDownwards('setSize');
    }
  }

  /**
   * If the user hovers above the header part of the stack, indicate drop positions for tabs.
   * otherwise indicate which segment of the body the dragged item would be dropped on
   *
   * @param x Absolute Screen X
   * @param y Absolute Screen Y
   */
  _$highlightDropZone(x: number, y: number) {
    if (!this._contentAreaDimensions) {
      return;
    }

    for (let [segment, dimensions] of Object.entries(
      this._contentAreaDimensions
    ) as [BodySegment, HoverDimensions][]) {
      const area = dimensions.hoverArea;

      if (area.x1 < x && area.x2 > x && area.y1 < y && area.y2 > y) {
        if (segment === 'header') {
          this._dropSegment = 'header';
          this._highlightHeaderDropZone(x);
        } else {
          this._resetHeaderDropZone();
          this._highlightBodyDropZone(segment);
        }

        return;
      }
    }
  }

  _$getArea() {
    if (this.element.is(':visible') === false) {
      return null;
    }

    const headerArea = super._$getArea(this.header.element);
    const contentArea = super._$getArea(this.childElementContainer);
    if (headerArea == null || contentArea == null) {
      return null;
    }

    const contentWidth = contentArea.x2 - contentArea.x1;
    const contentHeight = contentArea.y2 - contentArea.y1;

    this._contentAreaDimensions = {
      header: {
        hoverArea: {
          x1: headerArea.x1,
          y1: headerArea.y1,
          x2: headerArea.x2,
          y2: headerArea.y2,
        },
        highlightArea: {
          x1: headerArea.x1,
          y1: headerArea.y1,
          x2: headerArea.x2,
          y2: headerArea.y2,
        },
      },
    };

    /**
     * If this Stack is a parent to rows, columns or other stacks only its
     * header is a valid dropzone.
     */
    if (
      this._activeContentItem &&
      this._activeContentItem.isComponent === false
    ) {
      return headerArea;
    }

    /**
     * Highlight the entire body if the stack is empty
     */
    if (this.contentItems.length === 0) {
      this._contentAreaDimensions.body = {
        hoverArea: {
          x1: contentArea.x1,
          y1: contentArea.y1,
          x2: contentArea.x2,
          y2: contentArea.y2,
        },
        highlightArea: {
          x1: contentArea.x1,
          y1: contentArea.y1,
          x2: contentArea.x2,
          y2: contentArea.y2,
        },
      };

      return super._$getArea(this.element);
    }

    this._contentAreaDimensions.left = {
      hoverArea: {
        x1: contentArea.x1,
        y1: contentArea.y1,
        x2: contentArea.x1 + contentWidth * 0.25,
        y2: contentArea.y2,
      },
      highlightArea: {
        x1: contentArea.x1,
        y1: contentArea.y1,
        x2: contentArea.x1 + contentWidth * 0.5,
        y2: contentArea.y2,
      },
    };

    this._contentAreaDimensions.top = {
      hoverArea: {
        x1: contentArea.x1 + contentWidth * 0.25,
        y1: contentArea.y1,
        x2: contentArea.x1 + contentWidth * 0.75,
        y2: contentArea.y1 + contentHeight * 0.5,
      },
      highlightArea: {
        x1: contentArea.x1,
        y1: contentArea.y1,
        x2: contentArea.x2,
        y2: contentArea.y1 + contentHeight * 0.5,
      },
    };

    this._contentAreaDimensions.right = {
      hoverArea: {
        x1: contentArea.x1 + contentWidth * 0.75,
        y1: contentArea.y1,
        x2: contentArea.x2,
        y2: contentArea.y2,
      },
      highlightArea: {
        x1: contentArea.x1 + contentWidth * 0.5,
        y1: contentArea.y1,
        x2: contentArea.x2,
        y2: contentArea.y2,
      },
    };

    this._contentAreaDimensions.bottom = {
      hoverArea: {
        x1: contentArea.x1 + contentWidth * 0.25,
        y1: contentArea.y1 + contentHeight * 0.5,
        x2: contentArea.x1 + contentWidth * 0.75,
        y2: contentArea.y2,
      },
      highlightArea: {
        x1: contentArea.x1,
        y1: contentArea.y1 + contentHeight * 0.5,
        x2: contentArea.x2,
        y2: contentArea.y2,
      },
    };

    return super._$getArea(this.element);
  }

  _highlightHeaderDropZone(x: number) {
    const tabsLength = this.header.tabs.length;

    // I've omitted code for side edge tabs here
    // illumon doesn't need it, will slowly pull that code out elsewhere too

    // Empty stack
    if (tabsLength === 0) {
      const headerOffset = this.header.element.offset();

      // we don't have a placeholder to measure in the dom, lets just cheat and make it 100px.
      this.layoutManager.dropTargetIndicator?.highlightArea({
        x1: headerOffset?.left ?? 0,
        x2: (headerOffset?.left ?? 0) + 100,
        y1: this.header.element.offset()?.top ?? 0,
        y2:
          (this.header.element.offset()?.top ?? 0) +
          (this.header.element.innerHeight() ?? 0),
      });

      return;
    }

    const tabsContainer = this.header.tabsContainer;
    const tabsContainerRect = tabsContainer.get(0)?.getBoundingClientRect();
    const placeholderRect = this.layoutManager.tabDropPlaceholder
      .get(0)
      ?.getBoundingClientRect();

    if (!tabsContainerRect || !placeholderRect) {
      return;
    }

    if (x < tabsContainerRect.left) {
      // is over left tab controls button
      //  move x to a new point to inside left edge of container
      x = tabsContainerRect.left + 1;
    } else if (x > tabsContainerRect.right) {
      // is over right tab controls button
      // move x to a new point to inside right edge of container
      x = tabsContainerRect.right - 1;
    }

    let tabElement: JQuery<HTMLElement> | undefined;
    let tabRect: DOMRect | undefined;

    // if its not inide a placeholder,
    if (!(placeholderRect.left < x && x < placeholderRect.right)) {
      // which tab is it over ...
      for (var i = 0; i < tabsLength; i++) {
        tabElement = this.header.tabs[i].element;
        tabRect = tabElement.get(0)?.getBoundingClientRect();
        if (tabRect && tabRect.left < x && x < tabRect.right) {
          this._dropIndex = i;
          break;
        }
      }

      // we have tabRect at this x,y from the loop above
      if (tabElement && tabRect && x < tabRect.left + tabRect.width * 0.5) {
        // mostly before an element, insert placeholder before
        tabElement.before(this.layoutManager.tabDropPlaceholder);
      } else if (tabElement) {
        // x is likely after the lhe last item, position after and increase drop index
        this._dropIndex = Math.min((this._dropIndex ?? 0) + 1, tabsLength);
        tabElement.after(this.layoutManager.tabDropPlaceholder);
      }
    }

    let placeHolderLeft =
      this.layoutManager.tabDropPlaceholder.offset()?.left ?? 0;
    placeHolderLeft = Math.max(
      placeHolderLeft,
      this.header.tabsContainer.offset()?.left ?? 0
    );
    var placeHolderRight =
      placeHolderLeft + (this.layoutManager.tabDropPlaceholder.width() ?? 0);
    placeHolderRight = Math.min(
      placeHolderRight,
      (this.header.tabsContainer.offset()?.left ?? 0) +
        (this.header.tabsContainer.innerWidth() ?? 0)
    );
    this.layoutManager.dropTargetIndicator?.highlightArea({
      x1: placeHolderLeft,
      x2: placeHolderRight,
      y1: this.header.element.offset()?.top ?? 0,
      y2:
        (this.header.element.offset()?.top ?? 0) +
        (this.header.element.innerHeight() ?? 0),
    });
  }

  _resetHeaderDropZone() {
    this.layoutManager.tabDropPlaceholder.remove();
  }

  _setupHeaderPosition() {
    const side = ['right', 'left', 'bottom'].some(
      elem => elem === this._header.show
    )
      ? this._header.show
      : undefined;

    this.header.element.toggle(!!this._header.show);

    if (!side) {
      return;
    }

    this._side = side;
    this._sided = ['right', 'left'].indexOf(this._side.toString()) >= 0;
    this.element.removeClass('lm_left lm_right lm_bottom');
    if (this._side) this.element.addClass('lm_' + this._side);
    if (this.element.find('.lm_header').length && this.childElementContainer) {
      const headerPosition =
        ['right', 'bottom'].indexOf(this._side.toString()) >= 0
          ? 'before'
          : 'after';
      this.header.element[headerPosition](this.childElementContainer);
      this.callDownwards('setSize');
    }
  }

  _highlightBodyDropZone(segment: BodySegment) {
    const highlightArea = this._contentAreaDimensions?.[segment]?.highlightArea;
    if (highlightArea) {
      this.layoutManager.dropTargetIndicator?.highlightArea(highlightArea);
    }
    this._dropSegment = segment;
  }
}
