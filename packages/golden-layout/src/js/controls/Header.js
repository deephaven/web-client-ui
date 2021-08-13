/**
 * This class represents a header above a Stack ContentItem.
 *
 * @param {lm.LayoutManager} layoutManager
 * @param {lm.item.AbstractContentItem} parent
 */
lm.controls.Header = function( layoutManager, parent ) {
	lm.utils.EventEmitter.call( this );

	this.layoutManager = layoutManager;
	this.element = $( lm.controls.Header._template );

	if( this.layoutManager.config.settings.selectionEnabled === true ) {
		this.element.addClass( 'lm_selectable' );
    	this.element.on( 'click', lm.utils.fnBind(this._onHeaderClick, this ) );
	}

	this.tabsContainer = this.element.find( '.lm_tabs' );

	this.tabDropdownContainer = this.element.find( '.lm_tabdropdown_list' );
	this.tabDropdownContainer.hide();
	this.tabDropdownSearch = this.element.find( '.lm_tabdropdown_search input' );
	this.tabDropdownList = null;

	this._handleFilterInput = this._handleFilterInput.bind(this);
	this._handleFilterKeydown = this._handleFilterKeydown.bind(this);
	this.tabDropdownSearch.on('input', this._handleFilterInput);
	this.tabDropdownSearch.on('keydown', this._handleFilterKeydown);

	this.controlsContainer = this.element.find( '.lm_controls' );
	this.parent = parent;
	this.parent.on( 'resize', this._updateTabSizes, this );
	this.tabs = [];
	this.activeContentItem = null;
	this.closeButton = null;

	this.tabDropdownButton = null;
	this.tabNextButton =  $( lm.controls.Header._nextButtonTemplate );
	this.tabPreviousButton =  $( lm.controls.Header._previousButtonTemplate );

	this._handleItemPickedUp = this._handleItemPickedUp.bind(this);
	this._handleItemDropped = this._handleItemDropped.bind(this);

	this._handleNextMouseEnter = this._handleNextMouseEnter.bind(this);
	this._handleNextMouseLeave = this._handleNextMouseLeave.bind(this);
	this._handlePreviousMouseEnter = this._handlePreviousMouseEnter.bind(this);
	this._handlePreviousMouseLeave = this._handlePreviousMouseLeave.bind(this);
	this._handleScrollRepeat = this._handleScrollRepeat.bind(this);
	this._handleNextButtonMouseDown = this._handleNextButtonMouseDown.bind(this);
	this._handlePreviousButtonMouseDown = this._handlePreviousButtonMouseDown.bind(this);
	this._handleScrollButtonMouseDown = this._handleScrollButtonMouseDown.bind(this);
	this._handleScrollButtonMouseUp = this._handleScrollButtonMouseUp.bind(this);
	this._handleScrollEvent = this._handleScrollEvent.bind(this);

	this.tabNextButton.on('mousedown', this._handleNextButtonMouseDown);
	this.tabPreviousButton.on('mousedown', this._handlePreviousButtonMouseDown);
	this.tabsContainer.on('scroll', this._handleScrollEvent);


	// use for scroll repeat
	this.holdTimer = null;
	this.rAF = null;

	// mouse hold timeout to act as hold instead of click
	this.CLICK_TIMEOUT = 500;
	// mouse hold acceleration
	this.START_SPEED = 0.01;
	this.ACCELERATION = 0.0005;
	this.SCROLL_LEFT = 'left';
	this.SCROLL_RIGHT = 'right';

	this.layoutManager.on('itemPickedUp', this._handleItemPickedUp);
	this.layoutManager.on('itemDropped', this._handleItemDropped);

	this.isDraggingTab = false;
	this.isOverflowing = false;
	this.isDropdownShown = false;
	this.dropdownKeyIndex = 0;

	// append previous button template
	this.tabsContainer.before(this.tabPreviousButton);
	// change reference to just the li, not the wrapping ul
	this.tabPreviousButton = this.tabPreviousButton.find('>:first-child');
	this.tabPreviousButton.hide();

	this._showAdditionalTabsDropdown = this._showAdditionalTabsDropdown.bind(this);
	this._hideAdditionalTabsDropdown = this._hideAdditionalTabsDropdown.bind(this);

	this._lastVisibleTabIndex = -1;
	this._tabControlOffset = this.layoutManager.config.settings.tabControlOffset;
	this._createControls();



};

lm.controls.Header._template = [
	'<div class="lm_header">',
		'<ul class="lm_tabs"></ul>',
		'<ul class="lm_controls"></ul>',
		'<ul class="lm_tabdropdown_list">',
			'<li class="lm_tabdropdown_search"><input type="text" placeholder="Find tab..."></li>',
		'</ul>',
	'</div>'
].join( '' );

lm.controls.Header._previousButtonTemplate = [
	'<ul class="lm_controls">',
		'<li class="lm_tabpreviousbutton"></li>',
	'</ul>'
].join( '' );

lm.controls.Header._nextButtonTemplate = [
	'<li class="lm_tabnextbutton"></li>',
].join( '' );


lm.utils.copy( lm.controls.Header.prototype, {

	/**
	 * Creates a new tab and associates it with a contentItem
	 *
	 * @param    {lm.item.AbstractContentItem} contentItem
	 * @param    {Integer} index The position of the tab
	 *
	 * @returns {void}
	 */
	createTab: function( contentItem, index ) {
		var tab, i;

		//If there's already a tab relating to the
		//content item, don't do anything
		for( i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[ i ].contentItem === contentItem ) {
				return;
			}
		}

		tab = new lm.controls.Tab( this, contentItem );

		if( this.tabs.length === 0 ) {
			this.tabs.push( tab );
			this.tabsContainer.append( tab.element );
			return;
		}

		if( index === undefined ) {
			index = this.tabs.length;
		}

		if( index > 0 ) {
			this.tabs[ index - 1 ].element.after( tab.element );
		} else {
			this.tabs[ 0 ].element.before( tab.element );
		}

		this.tabs.splice( index, 0, tab );
		this._updateTabSizes();
	},

	/**
	 * Finds a tab based on the contentItem its associated with and removes it.
	 *
	 * @param    {lm.item.AbstractContentItem} contentItem
	 *
	 * @returns {void}
	 */
	removeTab: function( contentItem ) {
		for( var i = 0; i < this.tabs.length; i++ ) {
			if( this.tabs[ i ].contentItem === contentItem ) {
				this.tabs[ i ]._$destroy();
				this.tabs.splice( i, 1 );
				return;
			}
		}

		throw new Error( 'contentItem is not controlled by this header' );
	},

	/**
	 * The programmatical equivalent of clicking a Tab.
	 *
	 * @param {lm.item.AbstractContentItem} contentItem
	 */
	setActiveContentItem: function( contentItem ) {
		var isActive;

		for(var i = 0; i < this.tabs.length; i++ ) {
			isActive = this.tabs[ i ].contentItem === contentItem;
			this.tabs[ i ].setActive( isActive );
			if( isActive === true ) {
				this.activeContentItem = contentItem;
				this.parent.config.activeItemIndex = i;
			}
		}

		// makes sure dropped tabs are scrollintoview, removed any re-ordering
		this.tabs[this.parent.config.activeItemIndex].element.get(0).scrollIntoView({
			inline: 'nearest',
		});

		this._hideAdditionalTabsDropdown();
		this._updateTabSizes();
		this.parent.emitBubblingEvent( 'stateChanged' );
	},

	/**
	 * Programmatically operate with header position.
	 *
	 * @param {string} position one of ('top','left','right','bottom') to set or empty to get it.
	 *
	 * @returns {string} previous header position
	 */
	position: function( position ) {
		var previous = this.parent._header.show;
		if( previous && !this.parent._side )
			previous = 'top';
		if( position !== undefined && this.parent._header.show !== position ) {
			this.parent._header.show = position;
			this.parent._setupHeaderPosition();
		}
		return previous;
	},

	// Manually attaching so wheel can be passive instead of jquery .on
	// _attachWheelListener is called by parent init
	_attachWheelListener: function() {
		this.tabsContainer.get(0).addEventListener('wheel', this._handleWheelEvent, {passive: true} );
	},

	// detach called by this.destroy
	_detachWheelListener: function() {
		this.tabsContainer.get(0).removeEventListener('wheel', this._handleWheelEvent, {passive: true} );
	},

	_handleWheelEvent: function( event ) {
		var target = event.currentTarget;
		
		// we only care about the larger of the two deltas
		var delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
		
		// jshint
		/* globals WheelEvent */
		if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
			// Users can set OS to be in deltaMode page
			// scrolly by page units as pixels
			delta *= this.tabsContainer.innerWidhth();
		} else if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
			// chrome goes 100px per 3 lines, and firefox would go 102 per 3 (17 lineheight * 3 lines * 2)
			delta *= 100/3;
		}
		target.scrollLeft += Math.round(delta);
	},

	// on scroll we need to check if side error might need to be disabled
	_handleScrollEvent: function(){
		this._checkScrollArrows();
	},
	
	// when and item is picked up, attach mouse enter listeners to next/previous buttons
	_handleItemPickedUp: function() {
		this.isDraggingTab = true;
		this.controlsContainer.on('mouseenter', this._handleNextMouseEnter);
		this.tabPreviousButton.on('mouseenter', this._handlePreviousMouseEnter);
	},

	// when an item is dropped remove listeners and cancel animation
	_handleItemDropped: function() {
		this.isDraggingTab = false;
		this.rAF = window.cancelAnimationFrame(this.rAF);
		this.controlsContainer.off('mouseenter', this._handleNextMouseEnter);
		this.controlsContainer.off('mouseleave', this._handleNextMouseLeave);
		this.tabPreviousButton.off('mouseenter', this._handlePreviousMouseEnter);
		this.tabPreviousButton.off('mouseleave', this._handlePreviousMouseLeave);
	},

	// on next/previous enter start scroll repeat animation loop
	// and attach a listener looking for mouseleave
	// cancel animation on mouse leave, and remove leave listener
	_handleNextMouseEnter: function() {
		this.controlsContainer.on('mouseleave', this._handleNextMouseLeave);
		this._handleScrollRepeat(this.SCROLL_RIGHT, this.tabsContainer.scrollLeft());
	},
	
	_handlePreviousMouseEnter: function() {
		this.tabPreviousButton.on('mouseleave', this._handlePreviousMouseLeave);
		this._handleScrollRepeat(this.SCROLL_LEFT, this.tabsContainer.scrollLeft());
	},

	_handleNextMouseLeave: function() {
		this.rAF =  window.cancelAnimationFrame(this.rAF);
		this.controlsContainer.off('mouseleave', this._handleNextMouseLeave);
	},

	_handlePreviousMouseLeave: function() {
		this.rAF = window.cancelAnimationFrame(this.rAF);
		this.tabPreviousButton.off('mouseleave', this._handlePreviousMouseLeave);
	},

	// scroll one tab to the right on mouse down
	// start scrollRepeat if mouse is held down
	_handleNextButtonMouseDown: function() {
		var rightOffscreenChild;
		for (var i = 0; i < this.tabs.length; i += 1) {
		  if (
			this.tabs[i].element.get(0).offsetLeft >
			this.tabsContainer.get(0).offsetWidth + this.tabsContainer.scrollLeft()
		  ) {
			rightOffscreenChild = this.tabs[i].element.get(0);
			break;
		  }
		}
	
		if (rightOffscreenChild) {
		  rightOffscreenChild.scrollIntoView({ behavior: 'smooth', inline: 'nearest' });
		  this._handleScrollButtonMouseDown(this.SCROLL_RIGHT);
		} else {
			this.tabsContainer.get(0).scrollLeft = this.tabsContainer.get(0).scrollWidth;
		}	
	},

	// scroll left by one tab
	// start scrollRepeat if mouse is held down
	_handlePreviousButtonMouseDown: function() {
		var leftOffscreenChild;
		for (var i = this.tabs.length - 1; i >= 0; i -= 1) {
		  if (this.tabs[i].element.get(0).offsetLeft < this.tabsContainer.scrollLeft()) {
			leftOffscreenChild = this.tabs[i].element.get(0);
			break;
		  }
		}
		if (leftOffscreenChild) {
		  leftOffscreenChild.scrollIntoView({ behavior: 'smooth', inline: 'start' });
		  this._handleScrollButtonMouseDown(this.SCROLL_LEFT);
		} else {
			this.tabsContainer.get(0).scrollLeft = 0;
		}
	},

	// when hold timer is reached start scroll repeat anim loop
	// cancel it when mouse up happens anywhere
	_handleScrollButtonMouseDown: function(direction) {
		// closure so that scrollLeft is value at end of timer, and not start of timer
		this.holdTimer = setTimeout(function(){
			this._handleScrollRepeat(direction,this.tabsContainer.scrollLeft(), 100); // kickstart deltaX to be faster
		  }.bind(this),
		  this.CLICK_TIMEOUT
		);
		window.addEventListener('mouseup', this._handleScrollButtonMouseUp);
	},
	
	// cancel scroll repeat
	_handleScrollButtonMouseUp: function() {
		this.holdTimer = clearTimeout(this.holdTimer);
		this.rAF = cancelAnimationFrame(this.rAF);
		window.removeEventListener('mouseup', this._handleScrollButtonMouseUp);
	},


	// disables scroll arrow if at edge of scroll area
	_checkScrollArrows: function() {
		if (this.tabsContainer.scrollLeft() === 0) {
			this.tabPreviousButton.first().attr('disabled', true);
		}
		else if (
			this.tabsContainer.scrollLeft() + this.tabsContainer.innerWidth() ===
			this.tabsContainer.get(0).scrollWidth
		){
			this.tabNextButton.attr('disabled', true);
		}
		else {
			this.tabNextButton.attr('disabled', false);
			this.tabPreviousButton.first().attr('disabled', false);
		}
	},

	// scrolls the tab header container on drag tab over control buttons
	// or on press and hold of scroll arrows at either end
	// called recurisevly in an animation loop until cancelled
	// or directional end is reached
	_handleScrollRepeat: function(direction, startX, deltaX, prevTimestamp) {
		if (!deltaX) deltaX = 0;

		var tabContainerRect = this.tabsContainer.get(0).getBoundingClientRect();
		if (direction === this.SCROLL_LEFT) {
			this.tabsContainer.scrollLeft(startX - deltaX);
			if (this.isDraggingTab) {
				// update drag placeholder
				this.parent._highlightHeaderDropZone(tabContainerRect.left - 1);
			}
			// stop loop at left edge
			if (this.tabsContainer.scrollLeft() === 0) {
				this._checkScrollArrows();
				return;
			}
		} else if (direction === this.SCROLL_RIGHT) {
			this.tabsContainer.scrollLeft(startX + deltaX);
			if (this.isDraggingTab) {
				// update drag placeholder
				this.parent._highlightHeaderDropZone(tabContainerRect.right + 1);
			}
			// stop loop at right edge
			if (this.tabsContainer.scrollLeft() + this.tabsContainer.innerWidth() ===
				this.tabsContainer.get(0).scrollWidth) 
			{
				this._checkScrollArrows();
				return;
			}
		}
	
		// setup animation loop, scroll with acceleration
		window.cancelAnimationFrame(this.rAF);
		this.rAF = window.requestAnimationFrame(function(timestamp){
			var startTime = prevTimestamp || timestamp;
			var deltaTime = timestamp - startTime;
			var newDeltaX = this.START_SPEED * deltaTime + 0.5 * this.ACCELERATION * (deltaTime * deltaTime);
			newDeltaX = Math.min(newDeltaX, this.tabsContainer.get(0).scrollWidth);
			this._handleScrollRepeat(direction, startX, newDeltaX, startTime);
		}.bind(this));
	
	},


	/**
	 * Programmatically set closability.
	 *
	 * @package private
	 * @param {Boolean} isClosable Whether to enable/disable closability.
	 *
	 * @returns {Boolean} Whether the action was successful
	 */
	_$setClosable: function( isClosable ) {
		if( this.closeButton && this._isClosable() ) {
			this.closeButton.element[ isClosable ? 'show' : 'hide' ]();
			return true;
		}

		return false;
	},

	/**
	 * Destroys the entire header
	 *
	 * @package private
	 *
	 * @returns {void}
	 */
	_$destroy: function() {
		this.emit( 'destroy', this );

		for( var i = 0; i < this.tabs.length; i++ ) {
			this.tabs[ i ]._$destroy();
		}

		this._detachWheelListener();
		this._handleItemDropped();

		$( document ).off('mouseup', this._hideAdditionalTabsDropdown);
		this.tabDropdownSearch.off('input', this._handleFilterInput);
		this.tabDropdownSearch.off('keydown', this._handleFilterKeydown);
		
		this.element.remove();
	},

	/**
	 * get settings from header
	 *
	 * @returns {string} when exists
	 */
	_getHeaderSetting: function( name ) {
		if( name in this.parent._header )
			return this.parent._header[ name ];
	},

	/**
	 * Creates the popout, maximise and close buttons in the header's top right corner
	 *
	 * @returns {void}
	 */
	_createControls: function() {
		var closeStack,
			popout,
			label,
			maximiseLabel,
			minimiseLabel,
			maximise,
			maximiseButton,
			tabDropdownLabel,
			tabOverflowNextLabel,
			tabOverflowPreviousLabel;

		/**
		 * Dropdown to show additional tabs.
		 */
		
		tabDropdownLabel = this.layoutManager.config.labels.tabDropdown;
		tabOverflowNextLabel = this.layoutManager.config.labels.tabNextLabel;
		tabOverflowPreviousLabel = this.layoutManager.config.labels.tabPreviousLabel;

		this.tabDropdownButton = 
			new lm.controls.HeaderButton( this, tabDropdownLabel, 'lm_tabdropdown', this._showAdditionalTabsDropdown );
		this.tabDropdownButton.element.hide();
		
		this.controlsContainer.prepend(this.tabNextButton);
		this.tabNextButton.hide();

		/**
		 * Popout control to launch component in new window.
		 */
		if( this._getHeaderSetting( 'popout' ) ) {
			popout = lm.utils.fnBind( this._onPopoutClick, this );
			label = this._getHeaderSetting( 'popout' );
			new lm.controls.HeaderButton( this, label, 'lm_popout', popout );
		}

		/**
		 * Maximise control - set the component to the full size of the layout
		 */
		if( this._getHeaderSetting( 'maximise' ) ) {
			maximise = lm.utils.fnBind( this.parent.toggleMaximise, this.parent );
			maximiseLabel = this._getHeaderSetting( 'maximise' );
			minimiseLabel = this._getHeaderSetting( 'minimise' );
			maximiseButton = new lm.controls.HeaderButton( this, maximiseLabel, 'lm_maximise', maximise );

			this.parent.on( 'maximised', function() {
				maximiseButton.element.attr( 'title', minimiseLabel );
			} );

			this.parent.on( 'minimised', function() {
				maximiseButton.element.attr( 'title', maximiseLabel );
			} );
		}

		/**
		 * Close button
		 */
		if( this._isClosable() ) {
			closeStack = lm.utils.fnBind( this.parent.remove, this.parent );
			label = this._getHeaderSetting( 'close' );
			this.closeButton = new lm.controls.HeaderButton( this, label, 'lm_close', closeStack );
		}
	},

	/**
	 * Shows drop down for additional tabs when there are too many to display.
	 *
	 * @returns {void}
	 */
  	_showAdditionalTabsDropdown: function() {
		if (this.isDropdownShown) {
			this._hideAdditionalTabsDropdown();
			return;
		}

		// clone tabs in the current list, with event listeners
		// and add them to the drop down
		this.tabDropdownList = 
			this.tabsContainer.clone(true)
				.appendTo( this.tabDropdownContainer )
				.children().removeClass('lm_active');

		// show the dropdown
		this.tabDropdownContainer.show();
		this.isDropdownShown = true;

		// dropdown is a part of the header z-index context
		// add class to header when dropdown is open
		// so we can bump the z-index of the lists parent
		this.element.addClass("lm_dropdown_open"); 

		// focus the dropdown filter list input
		this.tabDropdownSearch.val('').focus();
		this.dropdownKeyIndex = 0;
		this.tabDropdownList.eq(this.dropdownKeyIndex).addClass('lm_keyboard_active');
		
		$(document).on('mousedown', this._hideAdditionalTabsDropdown);
		this._updateAdditionalTabsDropdown();		
	},

	// enables synthetic keyboard navigation of the list
	_handleFilterKeydown: function(e) {
		if(this.dropdownKeyIndex === -1) return;

		if(e.key === 'Escape') {
			this._hideAdditionalTabsDropdown();
			return;
		}
		
		if (e.key === 'Enter' || e.key === ' ') {
			// simulate "click"
			this._hideAdditionalTabsDropdown();
			this.tabs[this.dropdownKeyIndex]._onTabClick();
			return;
		}
		
		function getNextDropdownIndex(startIndex, delta, tabDropdownList) {
			if (tabDropdownList.length < 2) {
				return -1;
			}
			var i = (startIndex + delta + tabDropdownList.length) % tabDropdownList.length;
			while (i !== startIndex) {
				if ( tabDropdownList.eq(i).css('display') !== 'none' ) {
					return i;
				}
				i = (i + delta + tabDropdownList.length) % tabDropdownList.length;
			}
			
			return startIndex;
		}

		// allow tab or arrow key navigation of list, prevent tabs default behaviour 
		if (e.key === 'ArrowDown' || (e.key === 'Tab' && e.shiftKey === false)) {
			e.preventDefault();
			this.tabDropdownList.eq(this.dropdownKeyIndex).removeClass('lm_keyboard_active');
			this.dropdownKeyIndex = getNextDropdownIndex(this.dropdownKeyIndex, 1, this.tabDropdownList);
			this.tabDropdownList.eq(this.dropdownKeyIndex).addClass('lm_keyboard_active');
		} else if (e.key === 'ArrowUp' || e.key === 'Tab') {
			e.preventDefault();
			this.tabDropdownList.eq(this.dropdownKeyIndex).removeClass('lm_keyboard_active');
			this.dropdownKeyIndex = getNextDropdownIndex(this.dropdownKeyIndex, -1, this.tabDropdownList);
			this.tabDropdownList.eq(this.dropdownKeyIndex).addClass('lm_keyboard_active');
			
		}
	},

	// filters the list
	_handleFilterInput: function(event) {
		// reset keyboard index
		this.tabDropdownList.eq(this.dropdownKeyIndex).removeClass('lm_keyboard_active');
		this.dropdownKeyIndex = -1;

		for (var i = 0; i < this.tabDropdownList.length; i++) {
			if (this.tabs[i].contentItem.config.title.toLowerCase().indexOf(event.target.value.toLowerCase()) !== -1) {
				this.tabDropdownList.eq(i).css('display', '');
				if(this.dropdownKeyIndex === -1) this.dropdownKeyIndex = i;
			}
			else {
				this.tabDropdownList.eq(i).css('display', 'none');
			}
		}

		if(this.dropdownKeyIndex !== -1) {
			this.tabDropdownList.eq(this.dropdownKeyIndex).addClass('lm_keyboard_active');
		}	
	},

	/**
	 * Hides drop down for additional tabs when needed. It is called via mousedown
	 * event on document when list is open, or programmatically when drag starts,
	 * or active tab changes etc.
	 *
	 * @returns {void}
	 */
	_hideAdditionalTabsDropdown: function(event) {

		// dropdown already closed, do nothing
		if (!this.isDropdownShown) return;
		
		if ( event && this.tabDropdownContainer.get(0).contains(event.target) ) {
			// prevent events occuring inside the list from causing a close
			return;
		}
		else if (event && this.tabDropdownButton.element.get(0) === event.target) {
			// do nothing on the mouse down so that the click event can close, rather then re-open
			return;
		}

		this.element.removeClass("lm_dropdown_open");
		this.tabDropdownContainer.hide();
		this.isDropdownShown = false;

		// remove the current tab list
		this.tabDropdownContainer.find('.lm_tabs').remove();

		$(document).off('mousedown', this._hideAdditionalTabsDropdown);
	},

	/**
	 * Ensures additional tab drop down doesn't overflow screen, and instead becomes scrollable.
	 *
	 * @returns {void}
	 */
	_updateAdditionalTabsDropdown: function() {
		this.tabDropdownContainer.css('max-height', '');
		var h = this.tabDropdownContainer[0].scrollHeight;
		if (h === 0) return; // height can be zero if called on a hidden or empty list

		var y = this.tabDropdownContainer.offset().top - $(window).scrollTop();

		// set max height of tab dropdown to be less then the viewport height - dropdown offset
		if (y + h > $(window).height()) {
			this.tabDropdownContainer.css('max-height', $(window).height() - y - 10); // 10 being a padding value
		}
	},

	/**
	 * Checks whether the header is closable based on the parent config and
	 * the global config.
	 *
	 * @returns {Boolean} Whether the header is closable.
	 */
	_isClosable: function() {
		return this.parent.config.isClosable && this.layoutManager.config.settings.showCloseIcon;
	},

	_onPopoutClick: function() {
		if( this.layoutManager.config.settings.popoutWholeStack === true ) {
			this.parent.popout();
		} else {
			this.activeContentItem.popout();
		}
	},


	/**
	 * Invoked when the header's background is clicked (not it's tabs or controls)
	 *
	 * @param    {jQuery DOM event} event
	 *
	 * @returns {void}
	 */
	_onHeaderClick: function( event ) {
		if( event.target === this.element[ 0 ] ) {
			this.parent.select();
		}
	},

	/**
	 * Pushes the tabs to the tab dropdown if the available space is not sufficient
	 *
	 * @returns {void}
	 */
	_updateTabSizes: function() {

		if( this.tabs.length === 0 ) {
			return;
		}

		if (!this.isOverflowing && this.tabsContainer.get(0).scrollWidth > this.tabsContainer.get(0).clientWidth  ) {
			this.tabDropdownButton.element.show();
			this.tabNextButton.show();
			this.tabPreviousButton.show();
			this.isOverflowing = true;
		}
		else if (this.isOverflowing && this.tabsContainer.get(0).scrollWidth <= this.tabsContainer.get(0).clientWidth) {
			this.tabDropdownButton.element.hide();
			this.tabNextButton.hide();
			this.tabPreviousButton.hide();
			this.isOverflowing = false;
		}

		if (this.isOverflowing) this._checkScrollArrows();
		
	},

} );

