import React from 'react';
import { dhTruck, vsTriangleDown } from '@deephaven/icons';
import { Button, ButtonGroup, DropdownMenu } from '@deephaven/components';

export default {
  title: 'Buttons/Regular',
  component: Button,
};

const Template = args => <Button {...args} />;

export const TextOnly = Template.bind({});

TextOnly.args = {
  kind: 'primary',
  children: 'Text Only',
  tooltip: 'Simple tooltip',
};

export const IconOnly = Template.bind({});

IconOnly.args = {
  kind: 'inline',
  icon: dhTruck,
};

export const IconAndText = Template.bind({});

IconAndText.args = {
  kind: 'ghost',
  icon: dhTruck,
  children: 'Truck',
};

const Template2 = args => <ButtonGroup {...args} />;

export const WithDropdown = Template2.bind({});

WithDropdown.args = {
  kind: 'primary',
  children: (
    <>
      <Button kind="primary">Primary</Button>
      <Button
        kind="primary"
        variant="group-end"
        icon={vsTriangleDown}
        style={{ minWidth: 'unset' }}
        onClick={() => null}
      >
        <DropdownMenu
          actions={[
            {
              title: 'Action 1',
              action: () => null,
            },
            {
              title: 'Action 2',
              action: () => null,
            },
          ]}
        />
      </Button>
    </>
  ),
};
