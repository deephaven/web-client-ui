import React, { Component } from 'react';
import { render, screen } from '@testing-library/react';
import ContextMenuItem from './ContextMenuItem';

type ClassComponentProps = {
  closeMenu?(): void;
  forwardedProps?: ForwardedProps;
  'data-testid'?: string;
};

type ForwardedProps = {
  closeMenu?;
};

class ClassComponent extends Component<ClassComponentProps> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { closeMenu } = this.props;
    if (closeMenu) closeMenu();
    const { forwardedProps } = this.props;
    if (forwardedProps) {
      const { closeMenu: innerCloseMenu } = forwardedProps;
      if (innerCloseMenu) {
        innerCloseMenu();
      }
    }

    return <p>{JSON.stringify(this.props)}</p>;
  }
}

function mountContextMenuItem(propsParam = {}) {
  const defaultProps = {
    closeMenu: () => false,
    menuItem: {
      title: 'Default',
      menuElement: undefined,
    },
    onMenuItemClick: () => false,
    onMenuItemMouseMove: () => false,
    onMenuItemContextMenu: () => false,
  };
  const props = { ...defaultProps, ...propsParam };

  // eslint-disable-next-line react/jsx-props-no-spreading
  return render(<ContextMenuItem {...props} />);
}

describe('menuElement', () => {
  it('does not pass forwardedProps prop to a native DOM element', () => {
    mountContextMenuItem({
      menuItem: {
        menuElement: <div id="native-DOM-element">This is a test button</div>,
      },
      'data-testid': 'native-button',
    });
    const div = screen.getByTestId('native-button');
    expect(screen.getByTestId('native-button')).toBeTruthy();
  });

  it('passes forwardedProps prop to a functional component', () => {
    const MenuElement = jest.fn(() => null);
    mountContextMenuItem({
      menuItem: { menuElement: <MenuElement /> },
    });
    expect(MenuElement).toHaveBeenCalledWith(
      expect.objectContaining({
        forwardedProps: expect.objectContaining({
          isKeyboardSelected: false,
          isMouseSelected: false,
        }),
      }),
      expect.objectContaining({})
    );
  });

  it('passes forwardedProps prop to a class component', () => {
    mountContextMenuItem({
      menuItem: {
        menuElement: <ClassComponent />,
      },
    });
    expect(
      screen.getByText(
        '{"forwardedProps":{"menuItem":{"menuElement":{"key":null,"ref":null,"props":{},"_owner":null,"_store":{}}},"isKeyboardSelected":false,"isMouseSelected":false,"iconElement":null}}'
      )
    ).toBeTruthy();
  });

  it('does not override props with conflicting names', () => {
    const menuElementCloseMenuProp = jest.fn(() => false);
    const contextMenuItemCloseMenuProp = jest.fn(() => false);

    const PropComponent = ({ closeMenu }) => {
      closeMenu();
      return null;
    };
    mountContextMenuItem({
      menuItem: {
        menuElement: <PropComponent closeMenu={menuElementCloseMenuProp} />,
      },
      closeMenu: contextMenuItemCloseMenuProp,
    });

    expect(menuElementCloseMenuProp).toHaveBeenCalledTimes(1);
    expect(contextMenuItemCloseMenuProp).toHaveBeenCalledTimes(0);
  });

  it('passes contextMenuItem props in forwardedProps', () => {
    const PropComponent = ({
      forwardedProps,
    }: {
      forwardedProps?: ForwardedProps;
    }) => {
      const { closeMenu } = forwardedProps;
      closeMenu();
      return null;
    };
    const contextMenuItemCloseMenuProp = jest.fn(() => false);

    mountContextMenuItem({
      menuItem: {
        menuElement: <PropComponent />,
      },
      closeMenu: contextMenuItemCloseMenuProp,
    });
    expect(contextMenuItemCloseMenuProp).toHaveBeenCalledTimes(1);
  });
});
