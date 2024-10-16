import React from 'react';
import { render } from '@testing-library/react';
import WidgetPanelTooltip from './WidgetPanelTooltip';

describe('WidgetPanelTooltip', () => {
  const descriptor = {
    name: 'TestName',
    type: 'PartitionedTable',
    description: 'This is a test description',
    displayName: 'Test Display Name',
  };

  it('renders the formatted type name', () => {
    const { getByText } = render(
      <WidgetPanelTooltip descriptor={descriptor} />
    );
    expect(getByText('Partitioned Table Name')).toBeInTheDocument();
  });

  it('renders the name and copy button', () => {
    const { getByText, getByRole } = render(
      <WidgetPanelTooltip descriptor={descriptor} />
    );
    expect(getByText('TestName')).toBeInTheDocument();
    expect(getByRole('button', { name: /copy name/i })).toBeInTheDocument();
  });

  it('renders the display name if different from name', () => {
    const { getByText } = render(
      <WidgetPanelTooltip descriptor={descriptor} />
    );
    expect(getByText('Display Name')).toBeInTheDocument();
    expect(getByText('Test Display Name')).toBeInTheDocument();
  });

  it('does not render the display name if same as name', () => {
    const { queryByText } = render(
      <WidgetPanelTooltip
        descriptor={{ ...descriptor, displayName: 'TestName' }}
      />
    );
    expect(queryByText('Display Name')).not.toBeInTheDocument();
  });

  it('renders the description if provided', () => {
    const { getByText } = render(
      <WidgetPanelTooltip descriptor={descriptor} />
    );
    expect(getByText('This is a test description')).toBeInTheDocument();
  });

  it('does not render the description if not provided', () => {
    const { queryByText } = render(
      <WidgetPanelTooltip descriptor={{ ...descriptor, description: '' }} />
    );
    expect(queryByText('This is a test description')).not.toBeInTheDocument();
  });

  it('renders children if provided', () => {
    const { getByText } = render(
      <WidgetPanelTooltip descriptor={descriptor}>
        <div>Child Element</div>
      </WidgetPanelTooltip>
    );
    expect(getByText('Child Element')).toBeInTheDocument();
  });
});
