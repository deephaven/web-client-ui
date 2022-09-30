import $ from 'jquery';
import type { Config } from '../config/Config.js';
import type { ItemConfigType } from '../config/ItemConfig.js';
import type LayoutManager from '../LayoutManager.js';
import EventEmitter from '../utils/EventEmitter.js';
import utils from '../utils/index.js';

type BrowserDimensions = {
  width: number;
  height: number;
  top: number;
  left: number;
};

/**
 * Pops a content item out into a new browser window.
 * This is achieved by
 *
 *    - Creating a new configuration with the content item as root element
 *    - Serializing and minifying the configuration
 *    - Opening the current window's URL with the configuration as a GET parameter
 *    - GoldenLayout when opened in the new window will look for the GET parameter
 *      and use it instead of the provided configuration
 *
 * @param config GoldenLayout item config
 * @param dimensions A map with width, height, top and left
 * @param parentId The id of the element the item will be appended to on popIn
 * @param indexInParent The position of this element within its parent
 * @param layoutManager
 */
export default class BrowserPopout extends EventEmitter {
  isInitialised = false;

  private _config: ItemConfigType[];
  private _dimensions: BrowserDimensions;
  private _parentId: string;
  private _indexInParent: number;
  private _layoutManager: LayoutManager;
  private _popoutWindow:
    | (Window & { __glInstance: LayoutManager })
    | null = null;
  private _id = null;

  constructor(
    config: ItemConfigType[],
    dimensions: BrowserDimensions,
    parentId: string,
    indexInParent: number,
    layoutManager: LayoutManager
  ) {
    super();

    this._config = config;
    this._dimensions = dimensions;
    this._parentId = parentId;
    this._indexInParent = indexInParent;
    this._layoutManager = layoutManager;
    this._createWindow();
  }

  toConfig() {
    if (this.isInitialised === false) {
      throw new Error("Can't create config, layout not yet initialised");
      return;
    }
    return {
      dimensions: {
        width: this.getGlInstance()?.width,
        height: this.getGlInstance()?.height,
        left:
          this._popoutWindow?.screenX ?? this._popoutWindow?.screenLeft ?? 0,
        top: this._popoutWindow?.screenY ?? this._popoutWindow?.screenTop ?? 0,
      },
      content: this.getGlInstance()?.toConfig().content,
      parentId: this._parentId,
      indexInParent: this._indexInParent,
    };
  }

  getGlInstance() {
    return this._popoutWindow?.__glInstance;
  }

  getWindow() {
    return this._popoutWindow;
  }

  close() {
    if (this.getGlInstance()) {
      this.getGlInstance()?._$closeWindow();
    } else {
      try {
        this.getWindow()?.close();
      } catch (e) {}
    }
  }

  /**
   * Returns the popped out item to its original position. If the original
   * parent isn't available anymore it falls back to the layout's topmost element
   */
  popIn() {
    var childConfig,
      parentItem,
      index = this._indexInParent;

    if (this._parentId) {
      /*
       * The $.extend call seems a bit pointless, but it's crucial to
       * copy the config returned by this.getGlInstance().toConfig()
       * onto a new object. Internet Explorer keeps the references
       * to objects on the child window, resulting in the following error
       * once the child window is closed:
       *
       * The callee (server [not server application]) is not available and disappeared
       */
      childConfig = $.extend(true, {}, this.getGlInstance()?.toConfig())
        .content[0];
      parentItem = this._layoutManager.root.getItemsById(this._parentId)[0];

      /*
       * Fallback if parentItem is not available. Either add it to the topmost
       * item or make it the topmost item if the layout is empty
       */
      if (!parentItem) {
        if ((this._layoutManager.root.contentItems.length ?? 0) > 0) {
          parentItem = this._layoutManager.root.contentItems[0];
        } else {
          parentItem = this._layoutManager.root;
        }
        index = 0;
      }
    }

    parentItem?.addChild(childConfig, this._indexInParent);
    this.close();
  }

  /**
   * Creates the URL and window parameter
   * and opens a new window
   */
  _createWindow() {
    const url = this._createUrl();
    /**
     * Bogus title to prevent re-usage of existing window with the
     * same title. The actual title will be set by the new window's
     * GoldenLayout instance if it detects that it is in subWindowMode
     */
    const title = Math.floor(Math.random() * 1000000).toString(36);
    /**
     * The options as used in the window.open string
     */
    const options = this._serializeWindowOptions({
      width: this._dimensions.width,
      height: this._dimensions.height,
      innerWidth: this._dimensions.width,
      innerHeight: this._dimensions.height,
      menubar: 'no',
      toolbar: 'no',
      location: 'no',
      personalbar: 'no',
      resizable: 'yes',
      scrollbars: 'no',
      status: 'no',
    });

    // I'm not entirely sure how __glInstance is mounted to the popout window
    this._popoutWindow = window.open(url, title, options) as Window & {
      __glInstance: LayoutManager;
    };

    if (!this._popoutWindow) {
      if (
        this._layoutManager.config.settings.blockedPopoutsThrowError === true
      ) {
        const error = new Error('Popout blocked') as Error & { type: string };
        error.type = 'popoutBlocked';
        throw error;
      } else {
        return;
      }
    }

    $(this._popoutWindow)
      .on('load', this._positionWindow.bind(this))
      .on('unload beforeunload', this._onClose.bind(this));

    /**
     * Polling the childwindow to find out if GoldenLayout has been initialised
     * doesn't seem optimal, but the alternatives - adding a callback to the parent
     * window or raising an event on the window object - both would introduce knowledge
     * about the parent to the child window which we'd rather avoid
     */
    let checkReadyInterval = window.setInterval(() => {
      if (
        this._popoutWindow?.__glInstance &&
        this._popoutWindow.__glInstance.isInitialised
      ) {
        this._onInitialised();
        window.clearInterval(checkReadyInterval);
      }
    }, 10);
  }

  /**
   * Serialises a map of key:values to a window options string
   *
   * @param windowOptions
   *
   * @returns serialised window options
   */
  _serializeWindowOptions(windowOptions: Record<string, unknown>) {
    var windowOptionsString = [],
      key;

    for (key in windowOptions) {
      windowOptionsString.push(key + '=' + windowOptions[key]);
    }

    return windowOptionsString.join(',');
  }

  /**
   * Creates the URL for the new window, including the
   * config GET parameter
   *
   * @returns URL
   */
  _createUrl() {
    var config: Partial<Config> = { content: this._config };
    const storageKey = 'gl-window-config-' + utils.getUniqueId();

    config = new utils.ConfigMinifier().minifyConfig(config);

    try {
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (e: any) {
      throw new Error('Error while writing to localStorage ' + e.toString());
    }

    const urlParts = document.location.href.split('?');

    // URL doesn't contain GET-parameters
    if (urlParts.length === 1) {
      return urlParts[0] + '?gl-window=' + storageKey;

      // URL contains GET-parameters
    } else {
      return document.location.href + '&gl-window=' + storageKey;
    }
  }

  /**
   * Move the newly created window roughly to
   * where the component used to be.
   */
  _positionWindow() {
    this._popoutWindow?.moveTo(this._dimensions.left, this._dimensions.top);
    this._popoutWindow?.focus();
  }

  /**
   * Callback when the new window is opened and the GoldenLayout instance
   * within it is initialised
   */
  _onInitialised() {
    this.isInitialised = true;
    this.getGlInstance()?.on('popIn', this.popIn, this);
    this.emit('initialised');
  }

  /**
   * Invoked 50ms after the window unload event
   */
  _onClose() {
    setTimeout(this.emit.bind(this, 'closed'), 50);
  }
}
