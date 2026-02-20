/** @deprecated Use `ItemConfig` instead. */
export type ItemConfigType = ItemConfig;

export type ItemConfig =
  | ColumnItemConfig
  | ComponentConfig
  | DefaultItemConfig
  | ReactComponentConfig
  | RootItemConfig
  | RowItemConfig
  | StackItemConfig;

export interface ItemConfigAttributes {
  /**
   * An array of configurations for items that will be created as children of this item.
   */
  content?: ItemConfig[];

  /**
   * The width of this item, relative to the other children of its parent in percent
   */
  width?: number;

  minWidth?: number;

  /**
   * The height of this item, relative to the other children of its parent in percent
   */
  height?: number;

  minHeight?: number;

  /**
   * A String or an Array of Strings. Used to retrieve the item using item.getItemsById()
   */
  id?: string | string[];

  /**
   * Determines if the item is closable. If false, the x on the items tab will be hidden and container.close()
   * will return false
   * Default: true
   */
  isClosable?: boolean;

  /**
   * The title of the item as displayed on its tab and on popout windows
   * Default: componentName or ''
   */
  title?: string;

  isFocusOnShow?: boolean;

  reorderEnabled?: boolean;

  header?: StackItemHeaderConfig;
}

export interface DefaultItemConfig extends ItemConfigAttributes {
  type: 'default';
}

export interface RowItemConfig extends ItemConfigAttributes {
  type: 'row';
}

export interface ColumnItemConfig extends ItemConfigAttributes {
  type: 'column';
}

export interface RootItemConfig extends ItemConfigAttributes {
  type: 'root';
}

export interface StackItemHeaderConfig {
  show?: boolean | 'top' | 'left' | 'right' | 'bottom';
  popout?: string;
  maximise?: string;
  close?: string;
  minimise?: string;
}

export interface StackItemConfig extends ItemConfigAttributes {
  type: 'stack';
  activeItemIndex?: number;
  header?: StackItemHeaderConfig;
  hasHeaders?: boolean;
}

export interface ComponentConfig extends ItemConfigAttributes {
  type: 'component';

  /**
   * The name of the component as specified in layout.registerComponent. Mandatory if type is 'component'.
   */
  componentName: string;

  /**
   * A serialisable object. Will be passed to the component constructor function and will be the value returned by
   * container.getState().
   * Default: {}
   */
  componentState?: Record<string, unknown>;
}

export interface ReactComponentConfig extends ItemConfigAttributes {
  type: 'react-component';

  componentName?: string;
  /**
   * The name of the component as specified in layout.registerComponent. Mandatory if type is 'react-component'
   */
  component: string;

  /**
   * Properties that will be passed to the component and accessible using this.props.
   */
  props?: any;
}

export function isGLComponentConfig(item: ItemConfig): item is ComponentConfig {
  return (item as ComponentConfig).componentName !== undefined;
}

export function isReactComponentConfig(
  item: ItemConfig
): item is ReactComponentConfig {
  return (item as ReactComponentConfig).component !== undefined;
}

export const itemDefaultConfig: DefaultItemConfig = Object.freeze({
  type: 'default',
  isClosable: true,
  isFocusOnShow: true,
  reorderEnabled: true,
  title: '',
});
