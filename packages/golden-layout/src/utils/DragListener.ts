import EventEmitter from './EventEmitter.js';

class DragListener extends EventEmitter {
  private _eElement: HTMLElement | Window | undefined;
  private _oDocument: Document | undefined;
  private _eBody: HTMLElement | undefined;

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

  constructor(eElement: HTMLElement | Window, destroyAfterMouseUp = false) {
    super();

    this._eElement = eElement;
    this._oDocument = document;
    this._eBody = document.body;
    // used by drag sources, to destroy listener at the right time
    this._destroyAfterMouseUp = destroyAfterMouseUp;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this._startDrag = this._startDrag.bind(this);

    // https://github.com/microsoft/TypeScript/issues/48546
    (this._eElement as HTMLElement).addEventListener(
      'mousedown',
      this.onMouseDown
    );
  }

  destroy() {
    (this._eElement as HTMLElement)?.removeEventListener(
      'mousedown',
      this.onMouseDown
    );
    this._oDocument?.removeEventListener('mouseup', this.onMouseUp);

    this._eElement = undefined;
    this._oDocument = undefined;
    this._eBody = undefined;

    clearTimeout(this._timeout);
    this._timeout = undefined;
  }

  onMouseDown(oEvent: MouseEvent) {
    oEvent.preventDefault();

    if (oEvent.button === 0) {
      var coordinates = this._getCoordinates(oEvent);

      this._nOriginalX = coordinates.x;
      this._nOriginalY = coordinates.y;

      this._oDocument?.addEventListener('mousemove', this.onMouseMove);
      this._oDocument?.addEventListener('mouseup', this.onMouseUp);

      this._timeout = window.setTimeout(this._startDrag, this._nDelay);
    }
  }

  onMouseMove(oEvent: MouseEvent) {
    if (this._timeout != null) {
      oEvent.preventDefault();

      var coordinates = this._getCoordinates(oEvent);

      this._nX = coordinates.x - this._nOriginalX;
      this._nY = coordinates.y - this._nOriginalY;

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

  onMouseUp(oEvent: MouseEvent) {
    if (this._timeout != null) {
      clearTimeout(this._timeout);
      this._oDocument?.removeEventListener('mousemove', this.onMouseMove);
      this._oDocument?.removeEventListener('mouseup', this.onMouseUp);
      this._oDocument
        ?.querySelector('iframe')
        ?.style.removeProperty('pointer-events');

      if (this._bDragging === true) {
        this._bDragging = false;
        this.emit('dragStop', oEvent, this._nOriginalX + this._nX);
      }

      // after dragStop, so that .lm_dragging is removed after size is processed
      // and any overflow: hidden remains applied during the calculations
      this._eBody?.classList.remove('lm_dragging');
      if (!(this._eElement instanceof Window)) {
        this._eElement?.classList.remove('lm_dragging');
      }

      if (this._destroyAfterMouseUp) this.destroy();
    }
  }

  _startDrag() {
    window.clearTimeout(this._timeout);
    this._bDragging = true;
    this._eBody?.classList.add('lm_dragging');
    if (!(this._eElement instanceof Window)) {
      this._eElement?.classList.add('lm_dragging');
    }
    this._oDocument
      ?.querySelector('iframe')
      ?.style.setProperty('pointer-events', 'none');
    this.emit('dragStart', this._nOriginalX, this._nOriginalY);
  }

  _getCoordinates(event: MouseEvent) {
    const baseEvent = event instanceof TouchEvent ? event.touches[0] : event;
    return {
      x: baseEvent.pageX,
      y: baseEvent.pageY,
    };
  }
}

export default DragListener;
