/**
 * Creates a drag item given a starting mouseevent
 * that can then be dragged into the Layout
 *
 * @param {Object} itemConfig the configuration for the contentItem that will be created
 * @param {LayoutManager} layoutManager
 * @param {MouseEvent} event used to get the starting position
 *
 * @constructor
 */
lm.controls.DragSourceFromEvent = function( itemConfig, layoutManager, event  ) {
	this._element = $(window); // we need something to listen for mousemoves against
	this._itemConfig = itemConfig;
	this._layoutManager = layoutManager;
	this._dragListener = null;

	this._createDragListener(event);

};

lm.utils.copy( lm.controls.DragSourceFromEvent.prototype, {

	/**
	 * Called initially and after every drag
	 *
	 * @returns {void}
	 */
	_createDragListener: function(event) {
		if( this._dragListener !== null ) {
			this._dragListener.destroy();
		}

		this._dragListener = new lm.utils.DragListener( this._element, true );
		this._dragListener.on( 'dragStart', this._onDragStart, this );
		this._dragListener.on( 'dragStop', this._destroy, this );

		// manaully pass in an event as mousedow, that already happened to start the dragListener
		this._dragListener._fDown(event);
		this._dragListener._startDrag(); 
	},

	_destroy: function () {
		this._dragListener = null;
		this._element = null;
		this._itemConfig = null;
		this._layoutManager = null;
	},
	
	/**
	 * Callback for the DragListener's dragStart event
	 *
	 * @param   {int} x the x position of the mouse on dragStart
	 * @param   {int} y the x position of the mouse on dragStart
	 *
	 * @returns {void}
	 */
	_onDragStart: function( x, y ) {
		var itemConfig = this._itemConfig;
		if( lm.utils.isFunction( itemConfig ) ) {
			itemConfig = itemConfig();
		}
		var contentItem = this._layoutManager._$normalizeContentItem( $.extend( true, {}, itemConfig ) );
		new lm.controls.DragProxy( x, y, this._dragListener, this._layoutManager, contentItem, null );
	}
} );
