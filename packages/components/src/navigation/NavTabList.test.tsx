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
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('NavTabList renderAfterTabContent', () => {
  it('renders content after tab title when renderAfterTabContent provided', async () => {
    const tabs = makeTabs(3);
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <NavTabList
        activeKey={tabs[0].key}
        tabs={tabs}
        onSelect={onSelect}
        renderAfterTabContent={tab => <span>{`${tab.title}-slot`}</span>}
      />
    );

    // Assert each tab's content is rendered
    tabs.forEach(tab => {
      expect(screen.getByText(`${tab.title}-slot`)).toBeInTheDocument();
    });

    // Selecting a tab still works with content present
    await user.click(screen.getByText('Tab 2'));
    expect(onSelect).toHaveBeenCalledWith('TAB_2');
  });
});
