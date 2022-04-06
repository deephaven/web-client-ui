/**
 * Represents an individual tab within a Stack's header
 *
 * @param {lm.controls.Header} header
 * @param {lm.items.AbstractContentItem} contentItem
 *
 * @constructor
 */
lm.controls.Tab = function (header, contentItem) {
  this.header = header;
  this.contentItem = contentItem;
  this.element = $(lm.controls.Tab._template);
  this.titleElement = this.element.find('.lm_title');
  this.closeElement = this.element.find('.lm_close_tab');
  this.closeElement[contentItem.config.isClosable ? 'show' : 'hide']();
  this.isActive = false;

  this.setTitle(contentItem.config.title);
  this.contentItem.on('titleChanged', this.setTitle, this);

  this._layoutManager = this.contentItem.layoutManager;

  if (
    this._layoutManager.config.settings.reorderEnabled === true &&
    contentItem.config.reorderEnabled === true
  ) {
    this._dragListener = new lm.utils.DragListener(this.element);
    this._dragListener.on('dragStart', this._onDragStart, this);
    this.contentItem.on(
      'destroy',
      this._dragListener.destroy,
      this._dragListener
    );
  }

  this._onTabClickFn = lm.utils.fnBind(this._onTabClick, this);
  this._onCloseClickFn = lm.utils.fnBind(this._onCloseClick, this);
  this._onTabContentFocusInFn = lm.utils.fnBind(
    this._onTabContentFocusIn,
    this
  );
  this._onTabContentFocusOutFn = lm.utils.fnBind(
    this._onTabContentFocusOut,
    this
  );

  this.element.on('mousedown', this._onTabClickFn);

  if (this.contentItem.config.isClosable) {
    this.closeElement.on('click', this._onCloseClickFn);
    this.closeElement.on('mousedown', this._onCloseMousedown);
  } else {
    this.closeElement.remove();
  }

  this.contentItem.tab = this;
  this.contentItem.emit('tab', this);
  this.contentItem.layoutManager.emit('tabCreated', this);

  if (this.contentItem.isComponent) {
    // add focus class to tab when content
    this.contentItem.container._contentElement
      .on('focusin click', this._onTabContentFocusInFn)
      .on('focusout', this._onTabContentFocusOutFn);

    this.contentItem.container.tab = this;
    this.contentItem.container.emit('tab', this);
  }
};

/**
 * The tab's html template
 *
 * @type {String}
 */
lm.controls.Tab._template = [
  '<li class="lm_tab">',
  '<span class="lm_title_before"></span>',
  '<span class="lm_title"></span>',
  '<div class="lm_close_tab"></div>',
  '</li>',
].join('');

lm.utils.copy(lm.controls.Tab.prototype, {
  /**
   * Sets the tab's title to the provided string and sets
   * its title attribute to a pure text representation (without
   * html tags) of the same string.
   *
   * @public
   * @param {String} title can contain html
   */
  setTitle: function (title) {
    // Disabling for illumon project, we want to manage our own tooltips
    // this.element.attr( 'title', lm.utils.stripTags( title ) );
    this.titleElement.html(title);
  },

  /**
   * Sets this tab's active state. To programmatically
   * switch tabs, use header.setActiveContentItem( item ) instead.
   *
   * @public
   * @param {Boolean} isActive
   */
  setActive: function (isActive) {
    if (isActive === this.isActive) {
      return;
    }
    this.isActive = isActive;

    if (isActive) {
      this.element.addClass('lm_active');
    } else {
      this.element.removeClass('lm_active');
    }
  },

  /**
   * Destroys the tab
   *
   * @private
   * @returns {void}
   */
  _$destroy: function () {
    this.element.off('mousedown', this._onTabClickFn);
    this.closeElement.off('click', this._onCloseClickFn);
    if (this.contentItem.isComponent) {
      this.contentItem.container._contentElement.off();
    }
    if (this._dragListener) {
      this.contentItem.off(
        'destroy',
        this._dragListener.destroy,
        this._dragListener
      );
      this._dragListener.off('dragStart', this._onDragStart);
      this._dragListener = null;
    }
    this.element.remove();
  },

  /**
   * Callback for the DragListener
   *
   * @param   {Number} x The tabs absolute x position
   * @param   {Number} y The tabs absolute y position
   *
   * @private
   * @returns {void}
   */
  _onDragStart: function (x, y) {
    if (this.contentItem.parent.isMaximised === true) {
      this.contentItem.parent.toggleMaximise();
    }

    new lm.controls.DragProxy(
      x,
      y,
      this._dragListener,
      this._layoutManager,
      this.contentItem,
      this.header.parent
    );
  },

  /**
   * Callback when the contentItem is focused in
   *
   * Why [0].focus():
   * https://github.com/jquery/jquery/commit/fe5f04de8fde9c69ed48283b99280aa6df3795c7
   * From jquery source: "If this is an inner synthetic event for an event with a bubbling surrogate (focus or blur),
   * assume that the surrogate already propagated from triggering the native event and prevent that from happening
   * again here. This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the bubbling surrogate
   * propagates *after* the non-bubbling base), but that seems less bad than duplication."
   *
   * @param {jQuery DOM event} event
   *
   * @private
   * @returns {void}
   */
  _onTabContentFocusIn: function () {
    if (
      !this.contentItem.container._contentElement[0].contains(
        document.activeElement
      )
    ) {
      // jquery 3.4.0 and later, jquery method optimizes out the focus from
      // happening in proper order. Can use HTMLElement.focus() to avoid.
      this.contentItem.container._contentElement[0].focus(); // [0] needed to use dom focus, not jquery method
    }
    this.element.addClass('lm_focusin');
  },

  /**
   * Callback when the contentItem is focused out
   *
   * @param {jQuery DOM event} event
   *
   * @private
   * @returns {void}
   */
  _onTabContentFocusOut: function () {
    if (
      !this.contentItem.container._contentElement[0].contains(
        document.activeElement
      )
    ) {
      this.element.removeClass('lm_focusin');
    }
  },

  /**
   * Callback when the tab is clicked
   *
   * @param {jQuery DOM event} event
   *
   * @private
   * @returns {void}
   */
  _onTabClick: function (event) {
    // left mouse button or tap
    if (!event || event.button === 0) {
      var activeContentItem = this.header.parent.getActiveContentItem();
      if (this.contentItem !== activeContentItem) {
        this.header.parent.setActiveContentItem(this.contentItem);
        this.contentItem.container.emit('tabClicked');
      } else if (
        this.contentItem.isComponent &&
        !this.contentItem.container._contentElement[0].contains(
          document.activeElement
        )
      ) {
        // if no focus inside put focus onto the container
        // so focusin always fires for tabclicks
        this.contentItem.container._contentElement.focus();

        // still emit tab clicked event, so panels can also
        // do it's own focus handling if desired
        this.contentItem.container.emit('tabClicked');
      }

      // might have been called from the dropdown
      this.header._hideAdditionalTabsDropdown();

      // makes sure clicked tabs scrollintoview (either those partially offscreen or in dropdown)
      this.element.get(0).scrollIntoView({
        inline: 'nearest',
        // behaviour smooth is not possible here, as when a tab becomes active it may attempt to take focus
        // which interupts any scroll behaviour from completeting
      });

      // middle mouse button
    } else if (event.button === 1 && this.contentItem.config.isClosable) {
      this._onCloseClick(event);
    }
  },

  /**
   * Callback when the tab's close button is
   * clicked
   *
   * @param   {jQuery DOM event} event
   *
   * @private
   * @returns {void}
   */
  _onCloseClick: function (event) {
    event.stopPropagation();
    if (this.contentItem.isComponent) {
      this.contentItem.container.close();
    } else {
      this.header.parent.removeChild(this.contentItem);
    }
  },

  /**
   * Callback to capture tab close button mousedown
   * to prevent tab from activating.
   *
   * @param (jQuery DOM event) event
   *
   * @private
   * @returns {void}
   */
  _onCloseMousedown: function (event) {
    event.stopPropagation();
  },
});
