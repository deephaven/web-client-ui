import React, { useEffect, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  defaultTheme,
  Item,
  Provider,
  TabList,
  Tabs,
} from '@adobe/react-spectrum';
import { DHCTabPanels } from './TabPanels';

function Counter({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        {label}: {count}
      </button>
    </div>
  );
}

function OnMountUnmount({
  onMount,
  onUnmount,
}: {
  onMount: () => void;
  onUnmount: () => void;
}) {
  useEffect(() => {
    onMount();
    return () => {
      onUnmount();
    };
  }, [onMount, onUnmount]);
  return null;
}

describe('TabPanels', () => {
  it('should not persist panel state by default when switching tabs', () => {
    render(
      <Provider theme={defaultTheme}>
        <Tabs aria-label="test">
          <TabList>
            <Item key="1">Tab 1</Item>
            <Item key="2">Tab 2</Item>
          </TabList>
          <DHCTabPanels>
            <Item key="1">
              <Counter label="foo" />
            </Item>
            <Item key="2">
              <Counter label="bar" />
            </Item>
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    screen.getByRole('button', { name: /foo/ }).click();
    expect(screen.getByText('foo: 1')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();

    screen.getByText('Tab 2', { selector: 'span' }).click();
    expect(screen.queryByText(/foo/)).not.toBeInTheDocument();
    expect(screen.queryByText('bar: 0')).toBeInTheDocument();

    screen.getByText('Tab 1', { selector: 'span' }).click();
    expect(screen.getByText('foo: 0')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();
  });

  it('should persist panel state when keepMounted is true', () => {
    render(
      <Provider theme={defaultTheme}>
        <Tabs aria-label="test">
          <TabList>
            <Item key="1">Tab 1</Item>
            <Item key="2">Tab 2</Item>
          </TabList>
          <DHCTabPanels keepMounted>
            <Item key="1">
              <Counter label="foo" />
            </Item>
            <Item key="2">
              <Counter label="bar" />
            </Item>
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    screen.getByRole('button', { name: /foo/ }).click();
    expect(screen.getByText('foo: 1')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();

    screen.getByText('Tab 2', { selector: 'span' }).click();
    expect(screen.queryByText(/foo/)).not.toBeInTheDocument();
    expect(screen.queryByText('bar: 0')).toBeInTheDocument();

    screen.getByText('Tab 1', { selector: 'span' }).click();
    expect(screen.getByText('foo: 1')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();
  });

  it('should not persist panel state when using a render function', () => {
    const tabs = [
      {
        id: '1',
        label: 'Tab 1',
        content: <Counter label="foo" />,
      },
      {
        id: '2',
        label: 'Tab 2',
        content: <Counter label="bar" />,
      },
    ];
    type Tab = (typeof tabs)[0];
    render(
      <Provider theme={defaultTheme}>
        <Tabs items={tabs} aria-label="test">
          <TabList>{(tab: Tab) => <Item>{tab.label}</Item>}</TabList>
          <DHCTabPanels keepMounted>
            {(tab: Tab) => <Item>{tab.content}</Item>}
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    screen.getByRole('button', { name: /foo/ }).click();
    expect(screen.getByText('foo: 1')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();

    screen.getByText('Tab 2', { selector: 'span' }).click();
    expect(screen.queryByText(/foo/)).not.toBeInTheDocument();
    expect(screen.queryByText('bar: 0')).toBeInTheDocument();

    screen.getByText('Tab 1', { selector: 'span' }).click();
    expect(screen.getByText('foo: 0')).toBeInTheDocument();
    expect(screen.queryByText(/bar/)).not.toBeInTheDocument();
  });

  it('should pass through style props', () => {
    render(
      <Provider theme={defaultTheme}>
        <Tabs aria-label="test">
          <TabList>
            <Item key="1">Tab 1</Item>
            <Item key="2">Tab 2</Item>
          </TabList>
          <DHCTabPanels
            aria-label="panels"
            UNSAFE_style={{ backgroundColor: 'red' }}
          >
            <Item key="1">
              <Counter label="foo" />
            </Item>
            <Item key="2">
              <Counter label="bar" />
            </Item>
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    expect(screen.getByLabelText('panels')).toHaveStyle(
      'background-color: red'
    );
  });

  it('should still unmount a panel that is not in the tree when using keepMounted', () => {
    const onMount = jest.fn();
    const onUnmount = jest.fn();
    const { rerender } = render(
      <Provider theme={defaultTheme}>
        <Tabs aria-label="test">
          <TabList>
            <Item key="1">Tab 1</Item>
            <Item key="2">Tab 2</Item>
          </TabList>
          <DHCTabPanels>
            <Item key="1">
              <Counter label="foo" />
            </Item>
            <Item key="2">
              <OnMountUnmount onMount={onMount} onUnmount={onUnmount} />
            </Item>
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    waitFor(() => expect(onMount).toHaveBeenCalledTimes(1));
    expect(onUnmount).toHaveBeenCalledTimes(0);

    rerender(
      <Provider theme={defaultTheme}>
        <Tabs aria-label="test">
          <TabList>
            <Item key="1">Tab 1</Item>
            <Item key="2">Tab 2</Item>
          </TabList>
          <DHCTabPanels>
            <Item key="1">
              <Counter label="foo" />
            </Item>
            <Item key="2">
              <Counter label="bar" />
            </Item>
          </DHCTabPanels>
        </Tabs>
      </Provider>
    );

    waitFor(() => expect(onUnmount).toHaveBeenCalledTimes(1));
  });
});
