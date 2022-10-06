import $ from 'jquery';
import EventEmitter from './EventEmitter.js';

class DragListener extends EventEmitter {
  private _eElement: JQuery<HTMLElement> | undefined;
  private _oDocument: JQuery<Document> | undefined;
  private _eBody: JQuery<HTMLElement> | undefined;

  private _destroyAfterMouseUp: boolean;

  /**
   * The delay after which to start the drag in milliseconds
   */
  private _nDelay = 400;

  private _timeout: number | undefined;
  public timeout: number | undefined;

  /**
   * The distance the mouse needs to be moved to qualify as a drag
   */
  private _nDistance = 10; //TODO - works better with delay only

  private _nX = 0;
  private _nY = 0;

  private _nOriginalX = 0;
  private _nOriginalY = 0;

  private _bDragging = false;

  constructor(eElement: JQuery<HTMLElement>, destroyAfterMouseUp = false) {
    super();

    this._eElement = eElement;
    this._oDocument = $(document);
    this._eBody = $(document.body);
    // used by drag sources, to destroy listener at the right time
    this._destroyAfterMouseUp = destroyAfterMouseUp;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this._startDrag = this._startDrag.bind(this);

    // https://github.com/microsoft/TypeScript/issues/48546
    this._eElement?.on('mousedown', this.onMouseDown);
  }

  destroy() {
    this._eElement?.unbind('mousedown', this.onMouseDown);
    this._oDocument?.unbind('mouseup', this.onMouseUp);

    this._eElement = undefined;
    this._oDocument = undefined;
    this._eBody = undefined;

    clearTimeout(this._timeout);
    this._timeout = undefined;
  }

  onMouseDown(oEvent: JQuery.TriggeredEvent) {
    oEvent.preventDefault();

    if (oEvent.button === 0) {
      var coordinates = this._getCoordinates(oEvent);

      this._nOriginalX = coordinates.x ?? 0;
      this._nOriginalY = coordinates.y ?? 0;

      this._oDocument?.on('mousemove', this.onMouseMove);
      this._oDocument?.on('mouseup', this.onMouseUp);

      this._timeout = window.setTimeout(this._startDrag, this._nDelay);
    }
  }

  onMouseMove(oEvent: JQuery.TriggeredEvent) {
    if (this._timeout != null) {
      oEvent.preventDefault();

      var coordinates = this._getCoordinates(oEvent);

      this._nX = (coordinates.x ?? 0) - this._nOriginalX;
      this._nY = (coordinates.y ?? 0) - this._nOriginalY;

      if (this._bDragging === false) {
        if (
          Math.abs(this._nX) > this._nDistance ||
          Math.abs(this._nY) > this._nDistance
        ) {
          this._startDrag();
        }
      }

      if (this._bDragging) {
        this.emit('drag', this._nX, this._nY, oEvent);
      }
    }
  }

  onMouseUp(oEvent: JQuery.TriggeredEvent) {
    if (this._timeout != null) {
      clearTimeout(this._timeout);
      this._oDocument?.unbind('mousemove', this.onMouseMove);
      this._oDocument?.unbind('mouseup', this.onMouseUp);
      this._oDocument?.find('iframe')?.css('pointer-events', '');

      if (this._bDragging === true) {
        this._bDragging = false;
        this.emit('dragStop', oEvent, this._nOriginalX + this._nX);
      }

      // after dragStop, so that .lm_dragging is removed after size is processed
      // and any overflow: hidden remains applied during the calculations
      this._eBody?.removeClass('lm_dragging');
      if (!(this._eElement instanceof Window)) {
        this._eElement?.removeClass('lm_dragging');
      }

      if (this._destroyAfterMouseUp) this.destroy();
    }
  }

  _startDrag() {
    window.clearTimeout(this._timeout);
    this._bDragging = true;
    this._eBody?.addClass('lm_dragging');
    this._eElement?.addClass('lm_dragging');
    this._oDocument?.find('iframe')?.css('pointer-events', 'none');
    this.emit('dragStart', this._nOriginalX, this._nOriginalY);
  }

  _getCoordinates(event: JQuery.TriggeredEvent) {
    const baseEvent =
      event.originalEvent instanceof TouchEvent
        ? event.originalEvent.touches[0]
        : event;
    return {
      x: baseEvent.pageX,
      y: baseEvent.pageY,
    };
  }
}

export default DragListener;
