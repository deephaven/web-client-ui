import $ from 'jquery';
import DragListener from '../utils/DragListener.js';
import utils from '../utils/index.js';

export default class Splitter {
  private _isVertical: boolean;

  private _size: number;

  private _grabSize: number;

  private _dragListener: DragListener | null;

  element = this._createElement();

  constructor(isVertical: boolean, size: number, grabSize: number) {
    this._isVertical = isVertical;
    this._size = size;
    this._grabSize = grabSize < size ? size : grabSize;

    this._dragListener = new DragListener(this.element[0]);
  }

  on(event: string, callback: Function, context?: unknown) {
    this._dragListener?.on(event, callback, context);
  }

  _$destroy() {
    this._dragListener?.destroy();
    this._dragListener = null;
    this.element.remove();
  }

  _createElement() {
    var dragHandle = $('<div class="lm_drag_handle"></div>');
    var element = $('<div class="lm_splitter"></div>');
    element.append(dragHandle);

    var handleExcessSize = this._grabSize - this._size;
    var handleExcessPos = handleExcessSize / 2;

    if (this._isVertical) {
      dragHandle.css('top', -handleExcessPos);
      dragHandle.css('height', this._size + handleExcessSize);
      element.addClass('lm_vertical');
      element['height'](this._size);
    } else {
      dragHandle.css('left', -handleExcessPos);
      dragHandle.css('width', this._size + handleExcessSize);
      element.addClass('lm_horizontal');
      element['width'](this._size);
    }

    return element;
  }
}
