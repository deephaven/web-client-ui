import $ from 'jquery';
import { DragListener } from '../utils';

/**
 * IntersectionSplitter is a 2D drag handle that appears at the intersection of
 * two perpendicular splitters (e.g., where a horizontal splitter crosses a vertical splitter).
 *
 * This allows users to drag in both X and Y dimensions simultaneously to resize both
 * rows and columns at the same time, similar to VS Code's window management.
 *
 * Key differences from standard Splitter:
 * - Supports 2D mouse movement (both X and Y offsets)
 * - Uses a `move` (4-way) cursor
 * - Positioned at the intersection point
 * - Emits drag events with both offsetX and offsetY
 */
export default class IntersectionSplitter {
  private _size: number;
  private _grabSize: number;
  private _hitAreaSize: number;
  private _dragListener: DragListener | null;

  element: JQuery<HTMLElement>;

  /**
   * Creates a new IntersectionSplitter.
   *
   * @param size The size of the splitter in pixels (usually matches border width)
   * @param grabSize The size of the grab area (can be larger for usability)
   */
  constructor(size: number, grabSize: number) {
    this._size = size;
    this._grabSize = grabSize < size ? size : grabSize;
    this._hitAreaSize = Math.max(this._grabSize, 14);
    this.element = this._createElement();
    this._dragListener = new DragListener(this.element);
  }

  /**
   * Listen to events on this intersection splitter.
   *
   * @param event The event name ('drag', 'dragStart', 'dragStop')
   * @param callback The callback function
   * @param context The context to bind to
   */
  on(event: string, callback: Function, context?: unknown) {
    this._dragListener?.on(event, callback, context);
  }

  /**
   * Clean up and remove this intersection splitter from the DOM.
   */
  _$destroy() {
    this._dragListener?.destroy();
    this._dragListener = null;
    this.element.remove();
  }

  /**
   * Create the DOM element for the intersection splitter.
   *
   * The element is an invisible square grab area positioned at the crossing
   * point of two perpendicular splitters. It allows dragging in both dimensions.
   *
   * @returns The created jQuery element
   */
  private _createElement() {
    const dragHandle = $('<div class="lm_drag_handle"></div>');
    const element = $('<div class="lm_intersection_splitter"></div>');
    element.append(dragHandle);

    element.css({
      width: this._hitAreaSize,
      height: this._hitAreaSize,
    });

    // Prevent the mousedown from bubbling to the parent splitter's DragListener,
    // which would otherwise start a 1D drag in parallel.
    element.on('mousedown touchstart', event => {
      event.stopPropagation();
    });

    return element;
  }
}
