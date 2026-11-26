import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import type ItemContainer from '../container/ItemContainer';
import type { ReactComponentConfig } from '../config/ItemConfig';
import { Container } from '../container';
import EventEmitter from './EventEmitter';

export type GLPanelProps = {
  glContainer: Container;
  glEventHub: EventEmitter;
};

/**
 * A specialised GoldenLayout component that binds GoldenLayout container
 * lifecycle events to react components
 *
 * @param container
 * @param state state is not required for react components
 */
export default class ReactComponentHandler {
  private _container: ItemContainer<ReactComponentConfig>;

  private _reactComponent: React.ReactInstance | null = null;
  private _portalComponent: React.ReactPortal | null = null;
  private _originalComponentWillUpdate:
    | ((
        nextProps: Readonly<any>,
        nextState: Readonly<{}>,
        nextContext: any
      ) => void)
    | undefined = undefined;
  private _originalComponentWillUnmount: (() => void) | undefined = undefined;
  private _isDestroyed = false;
  private _initialState: unknown;
  private _reactClass: React.ComponentClass;

  constructor(container: ItemContainer<ReactComponentConfig>, state?: unknown) {
    this._reactComponent = null;
    this._portalComponent = null;
    this._originalComponentWillUpdate = undefined;
    this._container = container;
    this._initialState = state;
    this._reactClass = this._getReactClass();
    this._container.on('open', this._render, this);
    this._container.on('destroy', this._destroy, this);
  }

  /**
   * Gets the unique key to use for the react component
   * @returns Unique key for the component
   */
  _key(): string {
    const id = this._container._config.id;
    if (!id) {
      throw new Error('Cannot mount panel without id');
    }

    // If addId is called multiple times, an element can have multiple IDs in golden-layout
    // We don't use it, but changing the type requires many changes and a separate PR
    if (Array.isArray(id)) {
      return id.join(',');
    }

    return id;
  }

  /**
   * Creates the react class and component and hydrates it with
   * the initial state - if one is present
   *
   * By default, react's getInitialState will be used
   *
   * Creates a portal so the non-react golden-layout code still works,
   * but also allows us to mount the React components in the app's tree
   * instead of separate sibling root trees
   */
  _render() {
    const key = this._key();
    this._portalComponent = ReactDOM.createPortal(
      this._getReactComponent(),
      this._container.getElement()[0],
      key
    );

    this._container.layoutManager.addReactChild(key, this._portalComponent);
  }

  /**
   * Fired by react when the component is created.
   * <p>
   * Note: This callback is used instead of the return from `ReactDOM.render` because
   *	   of https://github.com/facebook/react/issues/10309.
   * </p>
   *
   * @param component The component instance created by the `ReactDOM.render` call in the `_render` method.
   */
  _gotReactComponent(component: React.ReactInstance) {
    if (!component) {
      return;
    }

    this._reactComponent = component;
    // Class components manipulate the lifecycle to hook into state changes
    // Functional components can save data with the usePersistentState hook
    if (this._reactComponent instanceof Component) {
      this._originalComponentWillUpdate =
        this._reactComponent.componentWillUpdate;
      this._reactComponent.componentWillUpdate = this._onUpdate.bind(this);
      this._originalComponentWillUnmount =
        this._reactComponent.componentWillUnmount;
      this._reactComponent.componentWillUnmount = this._onUnmount.bind(this);
      const state = this._container.getState();
      if (state) {
        this._reactComponent.setState(state);
      }
    }
  }

  /**
   * Removes the component from the DOM and thus invokes React's unmount lifecycle
   */
  _destroy() {
    this._isDestroyed = true;
    this._container.layoutManager.removeReactChild(
      this._key(),
      this._portalComponent
    );
    this._container.off('open', this._render, this);
    this._container.off('destroy', this._destroy, this);
  }

  /**
   * Hooks into React's state management and applies the componentstate
   * to GoldenLayout
   */
  _onUpdate(nextProps: Readonly<unknown>, nextState: Record<string, unknown>) {
    this._container.setState(nextState);
    this._originalComponentWillUpdate?.call(
      this._reactComponent,
      nextProps,
      nextState,
      undefined
    );
  }

  /**
   * Applies the state a class component sets while it unmounts, e.g. when it
   * flushes a debounced save, to GoldenLayout. React ignores state updates
   * made while unmounting, so they never reach `componentWillUpdate`.
   */
  _onUnmount() {
    const component = this._reactComponent as Component<
      unknown,
      Record<string, unknown>
    >;
    let nextState = component.state;
    let isChanged = false;
    // Shadows the prototype's setState while the component unmounts
    component.setState = update => {
      const partialState =
        typeof update === 'function'
          ? update(nextState, component.props)
          : update;
      if (partialState != null) {
        nextState = { ...nextState, ...partialState };
        isChanged = true;
      }
    };
    try {
      this._originalComponentWillUnmount?.call(component);
    } finally {
      delete (component as Partial<Component>).setState;
    }
    // A destroyed container's panel was closed, so its state is not saved
    if (isChanged && !this._isDestroyed) {
      this._container.setState(nextState);
    }
  }

  /**
   * Retrieves the react class from GoldenLayout's registry
   * @returns react class
   */
  _getReactClass() {
    var componentName = this._container._config.component;

    if (!componentName) {
      throw new Error(
        'No react component name. type: react-component needs a field `component`'
      );
    }

    const reactClass = (this._container.layoutManager.getComponent(
      componentName
    ) ||
      this._container.layoutManager.getFallbackComponent()) as unknown as React.ComponentClass;

    if (!reactClass) {
      throw new Error(
        'React component "' +
          componentName +
          '" not found. ' +
          'Please register all components with GoldenLayout using `registerComponent(name, component)`'
      );
    }

    return reactClass;
  }

  /**
   * Copies and extends the properties array and returns the React element
   */
  _getReactComponent() {
    var defaultProps = {
      glEventHub: this._container.layoutManager.eventHub,
      glContainer: this._container,
      /**
       * This ref assignment makes use of callback refs which is a legacy ref style in React.
       * It uses the callback to inject GoldenLayout _onUpdate into the React componentWillUpdate lifecycle.
       * This allows GoldenLayout to track the internal state of class components.
       * We then emit this state change and somewhere furter up, serialize it.
       * Specifically we look for state.panelState changes.
       * We should not do this going forward as it's quite unclear where/why your component's state might be saved.
       * This ref cannot be removed unless we refactor all existing panels to not rely on the magic of panelState.
       * DashboardUtils#dehydrate is where the panelState gets read/saved.
       */
      ref: this._gotReactComponent.bind(this),
    };
    var props = $.extend(defaultProps, this._container._config.props);
    return React.createElement(this._reactClass, props);
  }
}
