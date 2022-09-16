import $ from 'jquery';
import utils from './utils';
import EventEmitter from './EventEmitter';

const DragListener = function (eElement, destroyAfterMouseUp) {
  EventEmitter.call(this);

  this._eElement = $(eElement);
  this._oDocument = $(document);
  this._eBody = $(document.body);
  // used by drag sources, to destroy listener at the right time
  this._destroyAfterMouseUp = destroyAfterMouseUp || false;

  /**
   * The delay after which to start the drag in milliseconds
   */
  this._nDelay = 400;
  this._timeout = null;

  /**
   * The distance the mouse needs to be moved to qualify as a drag
   */
  this._nDistance = 10; //TODO - works better with delay only

  this._nX = 0;
  this._nY = 0;

  this._nOriginalX = 0;
  this._nOriginalY = 0;

  this._bDragging = false;

  this._fMove = utils.fnBind(this.onMouseMove, this);
  this._fUp = utils.fnBind(this.onMouseUp, this);
  this._fDown = utils.fnBind(this.onMouseDown, this);

  this._eElement.on('mousedown', this._fDown);
};

DragListener.timeout = null;

utils.copy(DragListener.prototype, {
  destroy: function () {
    this._eElement.unbind('mousedown', this._fDown);
    this._oDocument.unbind('mouseup', this._fUp);

    this._eElement = null;
    this._oDocument = null;
    this._eBody = null;

    clearTimeout(this._timeout);
    this._timeout = null;
  },

  onMouseDown: function (oEvent) {
    oEvent.preventDefault();

    if (oEvent.button === 0) {
      var coordinates = this._getCoordinates(oEvent);

      this._nOriginalX = coordinates.x;
      this._nOriginalY = coordinates.y;

      this._oDocument.on('mousemove', this._fMove);
      this._oDocument.one('mouseup', this._fUp);

      this._timeout = setTimeout(
        utils.fnBind(this._startDrag, this),
        this._nDelay
      );
    }
  },

  onMouseMove: function (oEvent) {
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
  },

  onMouseUp: function (oEvent) {
    if (this._timeout != null) {
      clearTimeout(this._timeout);
      this._oDocument.unbind('mousemove', this._fMove);
      this._oDocument.unbind('mouseup', this._fUp);
      this._oDocument.find('iframe').css('pointer-events', '');

      if (this._bDragging === true) {
        this._bDragging = false;
        this.emit('dragStop', oEvent, this._nOriginalX + this._nX);
      }

      // after dragStop, so that .lm_dragging is removed after size is processed
      // and any overflow: hidden remains applied during the calculations
      if (this._eBody) this._eBody.removeClass('lm_dragging');
      if (this._eElement) this._eElement.removeClass('lm_dragging');

      if (this._destroyAfterMouseUp) this.destroy();
    }
  },

  _startDrag: function () {
    clearTimeout(this._timeout);
    this._bDragging = true;
    this._eBody.addClass('lm_dragging');
    this._eElement.addClass('lm_dragging');
    this._oDocument.find('iframe').css('pointer-events', 'none');
    this.emit('dragStart', this._nOriginalX, this._nOriginalY);
  },

  _getCoordinates: function (event) {
    event =
      event.originalEvent && event.originalEvent.touches
        ? event.originalEvent.touches[0]
        : event;
    return {
      x: event.pageX,
      y: event.pageY,
    };
  },
});

export default DragListener;
