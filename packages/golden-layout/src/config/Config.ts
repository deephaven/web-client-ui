import type { ItemConfigType } from './ItemConfig';

export type Config = {
  settings: Settings;
  dimensions: Dimensions;
  labels: Labels;
  content: ItemConfigType[];
  maximisedItemId?: string;
  openPopouts?: PopoutConfig[];
};

export type PopoutConfig = Config & {
  parentId: string;
  indexInParent: number;
  dimensions: Dimensions & {
    width: number;

    height: number;

    left: number;

    top: number;
  };
};

export interface Settings {
  /**
   * Turns headers on or off. If false, the layout will be displayed with splitters only.
   * Default: true
   */
  hasHeaders: boolean;

  /**
   * Constrains the area in which items can be dragged to the layout's container. Will be set to false
   * automatically when layout.createDragSource() is called.
   * Default: true
   */
  constrainDragToContainer: boolean;

  /**
   * If true, the user can re-arrange the layout by dragging items by their tabs to the desired location.
   * Default: true
   */
  reorderEnabled: boolean;

  /**
   * If true, the user can select items by clicking on their header. This sets the value of layout.selectedItem to
   * the clicked item, highlights its header and the layout emits a 'selectionChanged' event.
   * Default: false
   */
  selectionEnabled: boolean;

  /**
   * Decides what will be opened in a new window if the user clicks the popout icon. If true the entire stack will
   * be transferred to the new window, if false only the active component will be opened.
   * Default: false
   */
  popoutWholeStack: boolean;

  /**
   * Specifies if an error is thrown when a popout is blocked by the browser (e.g. by opening it programmatically).
   * If false, the popout call will fail silently.
   * Default: true
   */
  blockedPopoutsThrowError: boolean;

  /**
   * Specifies if all popouts should be closed when the page that created them is closed. Popouts don't have a
   * strong dependency on their parent and can exist on their own, but can be quite annoying to close by hand. In
   * addition, any changes made to popouts won't be stored after the parent is closed.
   * Default: true
   */
  closePopoutsOnUnload: boolean;

  /**
   * Specifies if the popout icon should be displayed in the header-bar.
   * Default: true
   */
  showPopoutIcon: boolean;

  /**
   * Specifies if the maximise icon should be displayed in the header-bar.
   * Default: true
   */
  showMaximiseIcon: boolean;

  /**
   * Specifies if the close icon should be displayed in the header-bar.
   * Default: true
   */
  showCloseIcon: boolean;

  responsiveMode: 'onload' | 'always' | 'none'; // Can be onload, always, or none.

  /**
   * Maximum pixel overlap per tab
   */
  tabOverlapAllowance: number;

  tabControlOffset: number;
}

export interface Dimensions {
  /**
   * The width of the borders between the layout items in pixel. Please note: The actual draggable area is wider
   * than the visible one, making it safe to set this to small values without affecting usability.
   * Default: 5
   */
  borderWidth: number;

  borderGrabWidth: number;

  /**
   * The minimum height an item can be resized to (in pixel).
   * Default: 10
   */
  minItemHeight: number;

  /**
   * The minimum width an item can be resized to (in pixel).
   * Default: 10
   */
  minItemWidth: number;

  /**
   * The height of the header elements in pixel. This can be changed, but your theme's header css needs to be
   * adjusted accordingly.
   * Default: 20
   */
  headerHeight: number;

  /**
   * The width of the element that appears when an item is dragged (in pixel).
   * Default: 300
   */
  dragProxyWidth: number;

  /**
   * The height of the element that appears when an item is dragged (in pixel).
   * Default: 200
   */
  dragProxyHeight: number;
}

export interface Labels {
  /**
   * The tooltip text that appears when hovering over the close icon.
   * Default: 'close'
   */
  close: string;

  /**
   * The tooltip text that appears when hovering over the maximise icon.
   * Default: 'maximise'
   */
  maximise: string;

  /**
   * The tooltip text that appears when hovering over the minimise icon.
   * Default: 'minimise'
   */
  minimise: string;

  /**
   * The tooltip text that appears when hovering over the popout icon.
   * Default: 'open in new window'
   */
  popout: string;

  tabDropdown: string;

  tabNextLabel: string;

  tabPreviousLabel: string;

  popin: string;
}

export const defaultConfig: Config = Object.freeze({
  openPopouts: [],
  settings: {
    hasHeaders: true,
    constrainDragToContainer: true,
    reorderEnabled: true,
    selectionEnabled: false,
    popoutWholeStack: false,
    blockedPopoutsThrowError: true,
    closePopoutsOnUnload: true,
    showPopoutIcon: true,
    showMaximiseIcon: true,
    showCloseIcon: true,
    responsiveMode: 'onload', // Can be onload, always, or none.
    tabOverlapAllowance: 0, // maximum pixel overlap per tab
    // reorderOnTabMenuClick: true, // Deephaven disabled
    tabControlOffset: 10,
  },
  dimensions: {
    borderWidth: 5,
    borderGrabWidth: 10,
    minItemHeight: 10,
    minItemWidth: 10,
    headerHeight: 20,
    dragProxyWidth: 300,
    dragProxyHeight: 200,
  },
  labels: {
    close: 'Close',
    maximise: 'Maximize',
    minimise: 'Minimize',
    popout: 'Open in new window',
    popin: 'Pop in',
    tabDropdown: 'Additional tabs',
    tabNextLabel: 'Next',
    tabPreviousLabel: 'Previous',
  },
  content: [],
});
