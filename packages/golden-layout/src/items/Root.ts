import $ from 'jquery';
import type { ComponentConfig, ItemConfigType } from '../config/ItemConfig.js';
import LayoutManager from '../LayoutManager.js';
import AbstractContentItem, {
  isComponent,
  ItemArea,
} from './AbstractContentItem.js';
import RowOrColumn from './RowOrColumn.js';

export default class Root extends AbstractContentItem {
  childElementContainer: JQuery<HTMLElement>;

  private _containerElement: JQuery<HTMLElement>;

  constructor(
    layoutManager: LayoutManager,
    config: ComponentConfig | { content: ItemConfigType[] },
    containerElement: JQuery<HTMLElement>
  ) {
    super(
      layoutManager,
      { ...config, type: 'root' },
      null,
      $('<div class="lm_goldenlayout lm_item lm_root"></div>')
    );
    this.isRoot = true;
    this.type = 'root';
    this.childElementContainer = this.element;
    this._containerElement = containerElement;
    this._containerElement.append(this.element);
  }

  addChild(contentItem: AbstractContentItem | ItemConfigType, index?: number) {
    if (this.contentItems.length > 0) {
      throw new Error('Root node can only have a single child');
    }

    contentItem = this.layoutManager._$normalizeContentItem(contentItem, this);
    this.childElementContainer.append(contentItem.element);
    super.addChild(contentItem, index);

    this.callDownwards('setSize');
    this.emitBubblingEvent('stateChanged');
  }

  setSize(width?: number, height?: number) {
    width =
      typeof width === 'undefined'
        ? this._containerElement.width() ?? 0
        : width;
    height =
      typeof height === 'undefined'
        ? this._containerElement.height() ?? 0
        : height;

    this.element.width(width);
    this.element.height(height);

    /*
     * Root can be empty
     */
    if (this.contentItems[0]) {
      this.contentItems[0].element.width(width);
      this.contentItems[0].element.height(height);
    }
  }

  _$getArea() {
    const area = super._$getArea();
    if (area == null) {
      throw new Error('Unable to get root area');
    }
    return area;
  }

  _$highlightDropZone(x: number, y: number, area: ItemArea) {
    this.layoutManager.tabDropPlaceholder.remove();
    super._$highlightDropZone(x, y, area);
  }

  _$onDrop(contentItem: AbstractContentItem, area?: ItemArea) {
    var stack;

    if (isComponent(contentItem)) {
      stack = this.layoutManager.createContentItem(
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

    if (!this.contentItems.length) {
      this.addChild(contentItem);
    } else {
      const type = area?.side[0] == 'x' ? 'row' : 'column';
      const dimension: 'width' | 'height' =
        area?.side[0] == 'x' ? 'width' : 'height';
      var insertBefore = area?.side[1] == '2';
      var column = this.contentItems[0];
      if (!(column instanceof RowOrColumn) || column.type != type) {
        const rowOrColumn = this.layoutManager.createContentItem(
          { type: type },
          this
        ) as RowOrColumn;
        this.replaceChild(column, rowOrColumn);
        rowOrColumn.addChild(contentItem, insertBefore ? 0 : undefined, true);
        rowOrColumn.addChild(column, insertBefore ? undefined : 0, true);
        column.config[dimension] = 50;
        contentItem.config[dimension] = 50;
        rowOrColumn.callDownwards('setSize');
      } else {
        const sibling =
          column.contentItems[
            insertBefore ? 0 : column.contentItems.length - 1
          ];
        column.addChild(contentItem, insertBefore ? 0 : undefined, true);
        sibling.config[dimension] *= 0.5;
        contentItem.config[dimension] = sibling.config[dimension];
        column.callDownwards('setSize');
      }
    }
  }
}
