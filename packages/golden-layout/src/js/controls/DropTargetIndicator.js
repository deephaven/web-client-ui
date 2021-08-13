lm.controls.DropTargetIndicator = function() {
	this.element = $( lm.controls.DropTargetIndicator._template );
	$( document.body ).append( this.element );
};

lm.controls.DropTargetIndicator._template = '<div class="lm_dropTargetIndicator"><div class="lm_inner"></div></div>';

lm.utils.copy( lm.controls.DropTargetIndicator.prototype, {
	destroy: function() {
		this.element.remove();
	},

	highlightArea: function( area ) {
		this.element.css( {
			left: area.x1,
			top: area.y1,
			// marching ants were causing rendering artifacts with fractional pixels
			width: Math.floor(area.x2 - area.x1),
			height:  Math.floor(area.y2 - area.y1)
		} ).show();
	},

	hide: function() {
		this.element.hide();
	}
} );