import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavTabList, { type NavTabItem } from './NavTabList';

// Helper to build tabs
function makeTabs(count = 3): NavTabItem[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `TAB_${i + 1}`,
    title: `Tab ${i + 1}`,
    isClosable: false,
  }));
}

// JSDOM doesn't implement scrollIntoView; stub to avoid errors triggered by effect
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.HTMLElement as any).prototype.scrollIntoView = jest.fn();
});

describe('NavTabList renderTabSlot', () => {
  it('renders slot content for each tab when renderTabSlot provided', async () => {
    const tabs = makeTabs(3);
    const user = userEvent.setup();
    const slotTestId = (key: string) => `slot-${key}`;

    render(
      <NavTabList
        activeKey={tabs[0].key}
        tabs={tabs}
        onSelect={jest.fn()}
        renderTabSlot={tab => (
          <span data-testid={slotTestId(tab.key)}>{`${tab.title}-slot`}</span>
        )}
      />
    );

    // Assert each tab's slot is rendered
    tabs.forEach(tab => {
      expect(screen.getByTestId(slotTestId(tab.key))).toHaveTextContent(
        `${tab.title}-slot`
      );
    });

    // Basic interaction sanity: selecting a tab still works with slot present
    await user.click(screen.getByTestId('btn-nav-tab-Tab 2'));
  });

  it('does not render slot content when renderTabSlot is omitted', () => {
    const tabs = makeTabs(2);
    render(
      <NavTabList activeKey={tabs[0].key} tabs={tabs} onSelect={jest.fn()} />
    );

    // Querying any potential slot test id should fail
    const query = screen.queryByTestId('slot-TAB_1');
    expect(query).toBeNull();
  });
});
