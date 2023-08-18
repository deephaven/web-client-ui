import React from 'react';
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

  private _reactComponent: React.Component | null = null;
  private _portalComponent: React.ReactPortal | null = null;
  private _originalComponentWillUpdate: Function | null = null;
  private _initialState: unknown;
  private _reactClass: React.ComponentClass;

  constructor(container: ItemContainer<ReactComponentConfig>, state?: unknown) {
    this._reactComponent = null;
    this._portalComponent = null;
    this._originalComponentWillUpdate = null;
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
  _gotReactComponent(component: React.Component) {
    if (!component) {
      return;
    }

    this._reactComponent = component;
    this._originalComponentWillUpdate =
      this._reactComponent.componentWillUpdate || function () {};
    this._reactComponent.componentWillUpdate = this._onUpdate.bind(this);
    const state = this._container.getState();
    if (state) {
      this._reactComponent.setState(state);
    }
  }

  /**
   * Removes the component from the DOM and thus invokes React's unmount lifecycle
   */
  _destroy() {
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
  _onUpdate(nextProps: unknown, nextState: Record<string, unknown>) {
    this._container.setState(nextState);
    this._originalComponentWillUpdate?.call(
      this._reactComponent,
      nextProps,
      nextState
    );
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
      ref: this._gotReactComponent.bind(this),
    };
    var props = $.extend(defaultProps, this._container._config.props);
    return React.createElement(this._reactClass, props);
  }
}
