import React, { Component } from 'react';
import { mount } from 'enzyme';
import ContextMenuItem from './ContextMenuItem';

class ClassComponent extends Component {
  render() {
    return 'Default';
  }
}

function mountContextMenuItem(propsParam = {}) {
  const defaultProps = {
    closeMenu: () => {},
    menuItem: {
      title: 'Default',
      menuElement: null,
    },
    onMenuItemClick: () => {},
    onMenuItemMouseMove: () => {},
    onMenuItemContextMenu: () => {},
  };
  const props = { ...defaultProps, ...propsParam };

  // eslint-disable-next-line react/jsx-props-no-spreading
  return mount(<ContextMenuItem {...props} />);
}

describe('menuElement', () => {
  it('does not pass forwardedProps prop to a native DOM element', () => {
    const wrapper = mountContextMenuItem({
      menuItem: {
        menuElement: <div id="native-DOM-element" />,
      },
    });
    const element = wrapper.find('#native-DOM-element');
    expect(element.prop('forwardedProps')).not.toBeDefined();
  });

  it('passes forwardedProps prop to a functional component', () => {
    const FunctionalComponent = () => 'Default';
    const wrapper = mountContextMenuItem({
      menuItem: {
        menuElement: <FunctionalComponent />,
      },
    });
    const element = wrapper.find(FunctionalComponent);
    expect(element.prop('forwardedProps')).toBeDefined();
  });

  it('passes forwardedProps prop to a class component', () => {
    const wrapper = mountContextMenuItem({
      menuItem: {
        menuElement: <ClassComponent />,
      },
    });
    const element = wrapper.find(ClassComponent);
    expect(element.prop('forwardedProps')).toBeDefined();
  });

  it('does not override props with conflicting names and passes contextMenuItem props in forwardedProps', () => {
    const menuElementCloseMenuProp = () => {};
    const contextMenuItemCloseMenuProp = () => {};
    const wrapper = mountContextMenuItem({
      menuItem: {
        menuElement: <ClassComponent closeMenu={menuElementCloseMenuProp} />,
      },
      closeMenu: contextMenuItemCloseMenuProp,
    });
    const element = wrapper.find(ClassComponent);
    expect(element.prop('closeMenu')).toBeDefined();
    expect(element.prop('forwardedProps')).toHaveProperty('closeMenu');

    expect(element.prop('closeMenu')).toBe(menuElementCloseMenuProp);
    expect(element.prop('closeMenu')).not.toBe(contextMenuItemCloseMenuProp);

    expect(wrapper.prop('closeMenu')).toBe(contextMenuItemCloseMenuProp);
    expect(wrapper.prop('closeMenu')).not.toBe(menuElementCloseMenuProp);

    expect(element.prop('forwardedProps').closeMenu).toBe(
      contextMenuItemCloseMenuProp
    );
  });
});
