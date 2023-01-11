import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContextMenuItem from './ContextMenuItem';

type ForwardedProps = {
  closeMenu?;
};

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

  it('does not override props with conflicting names', async () => {
    const user = userEvent.setup();
    const menuElementCloseMenuProp = jest.fn(() => false);
    const contextMenuItemCloseMenuProp = jest.fn(() => false);

    interface PropComponentProp {
      closeMenu;
    }

    function PropComponent({ closeMenu }: PropComponentProp) {
      return (
        <button type="button" onClick={closeMenu}>
          close menu
        </button>
      );
    }

    mountContextMenuItem({
      menuItem: {
        menuElement: <PropComponent closeMenu={menuElementCloseMenuProp} />,
      },
      closeMenu: contextMenuItemCloseMenuProp,
    });
    await user.click(screen.getByText('close menu'));
    expect(menuElementCloseMenuProp).toHaveBeenCalledTimes(1);
    expect(contextMenuItemCloseMenuProp).toHaveBeenCalledTimes(0);
  });

  it('passes contextMenuItem props in forwardedProps', async () => {
    const user = userEvent.setup();
    function PropComponent({
      forwardedProps,
    }: {
      forwardedProps?: ForwardedProps;
    }) {
      const { closeMenu } = forwardedProps;
      return (
        <button type="button" onClick={closeMenu}>
          close menu
        </button>
      );
    }
    const contextMenuItemCloseMenuProp = jest.fn(() => false);

    mountContextMenuItem({
      menuItem: {
        menuElement: <PropComponent />,
      },
      closeMenu: contextMenuItemCloseMenuProp,
    });
    await user.click(screen.getByText('close menu'));
    expect(contextMenuItemCloseMenuProp).toHaveBeenCalledTimes(1);
  });
});
