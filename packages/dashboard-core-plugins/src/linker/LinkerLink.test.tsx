import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Type as FilterType } from '@deephaven/filters';
import LinkerLink from './LinkerLink';

function makeLinkerLink({
  x1 = 10,
  x2 = 50,
  y1 = 10,
  y2 = 10,
  isSelected = true,
  startColumnType = 'int',
  id = 'LINK_ID',
  className = 'linker-link link-is-selected',
  operator = FilterType.eq,
  onClick = jest.fn(),
  onDelete = jest.fn(),
  onOperatorChanged = jest.fn(),
} = {}) {
  return render(
    <LinkerLink
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
      id={id}
      className={className}
      operator={operator}
      isSelected={isSelected}
      startColumnType={startColumnType}
      onClick={onClick}
      onDelete={onDelete}
      onOperatorChanged={onOperatorChanged}
    />
  );
}

it('mounts and renders correct comparison operators for strings', async () => {
  const onOperatorChanged = jest.fn();
  const props = {
    startColumnType: 'java.lang.String',
    operator: FilterType.startsWith,
    onOperatorChanged,
  };
  makeLinkerLink(props);

  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  expect(dropdownAndDeleteButton[0]).toHaveTextContent('a*');

  dropdownAndDeleteButton[0].click();
  const dropdownMenu = await screen.findAllByRole('button');
  expect(dropdownMenu).toHaveLength(8); // includes dropdown and delete button
  expect(dropdownMenu[2]).toHaveTextContent('is exactly');
  expect(dropdownMenu[3]).toHaveTextContent('is not exactly');
  expect(dropdownMenu[4]).toHaveTextContent('contains');
  expect(dropdownMenu[5]).toHaveTextContent('does not contain');
  expect(dropdownMenu[6]).toHaveTextContent('starts with');
  expect(dropdownMenu[7]).toHaveTextContent('ends with');

  dropdownMenu[4].click();
  expect(onOperatorChanged).toHaveBeenCalledWith(
    'LINK_ID',
    FilterType.contains
  );
});

it('renders correct symbol for endsWith', async () => {
  makeLinkerLink({ operator: FilterType.endsWith });
  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  expect(dropdownAndDeleteButton[0]).toHaveTextContent('*z');
});

it('mounts and renders correct comparison operators for numbers', async () => {
  const props = {
    x1: 10,
    x2: 10,
    y1: 30,
    y2: 50,
    startColumnType: 'long',
    operator: FilterType.notEq,
  };
  makeLinkerLink(props);
  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  expect(dropdownAndDeleteButton[0]).toHaveTextContent('!=');

  dropdownAndDeleteButton[0].click();
  const dropdownMenu = await screen.findAllByRole('button');
  expect(dropdownMenu).toHaveLength(8); // includes dropdown and delete button
  expect(dropdownMenu[2]).toHaveTextContent('is equal to');
  expect(dropdownMenu[3]).toHaveTextContent('is not equal to');
  expect(dropdownMenu[4]).toHaveTextContent('greater than');
  expect(dropdownMenu[5]).toHaveTextContent('greater than or equal to');
  expect(dropdownMenu[6]).toHaveTextContent('less than');
  expect(dropdownMenu[7]).toHaveTextContent('less than or equal to');
});

it('mounts and renders correct comparison operators for date/time', async () => {
  const props = {
    x1: 10,
    x2: 20,
    y1: 50,
    y2: 30,
    startColumnType: 'io.deephaven.time.DateTime',
    operator: FilterType.lessThan,
  };
  makeLinkerLink(props);
  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  expect(dropdownAndDeleteButton[0]).toHaveTextContent('<');

  dropdownAndDeleteButton[0].click();
  const dropdownMenu = await screen.findAllByRole('button');
  expect(dropdownMenu).toHaveLength(8); // includes dropdown and delete button
  expect(dropdownMenu[2]).toHaveTextContent('date is');
  expect(dropdownMenu[3]).toHaveTextContent('date is not');
  expect(dropdownMenu[4]).toHaveTextContent('date is after');
  expect(dropdownMenu[5]).toHaveTextContent('date is after or equal');
  expect(dropdownMenu[6]).toHaveTextContent('date is before');
  expect(dropdownMenu[7]).toHaveTextContent('date is before or equal');
});

it('mounts and renders correct comparison operators for booleans', async () => {
  const props = {
    x1: 10,
    x2: 20,
    y1: 30,
    y2: 100,
    startColumnType: 'boolean',
    operator: FilterType.greaterThanOrEqualTo,
  };
  makeLinkerLink(props);
  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  expect(dropdownAndDeleteButton[0]).toHaveTextContent('>=');

  dropdownAndDeleteButton[0].click();
  const dropdownMenu = await screen.findAllByRole('button');
  expect(dropdownMenu).toHaveLength(4); // includes dropdown and delete button
  expect(dropdownMenu[2]).toHaveTextContent('is equal to');
  expect(dropdownMenu[3]).toHaveTextContent('is not equal to');
});

it('returns an empty label for invalid column type', async () => {
  const startColumnType = 'INVALID_TYPE';
  makeLinkerLink({ startColumnType });
  expect(LinkerLink.getLabelForLinkFilter(startColumnType, FilterType.eq)).toBe(
    ''
  );
});

it('calls onClick when the link is clicked and onDelete on alt-click and button press', async () => {
  const onClick = jest.fn();
  const onDelete = jest.fn();
  makeLinkerLink({ onClick, onDelete });

  const linkPath = screen.getByTestId('link-select');
  fireEvent.click(linkPath);
  expect(onClick).toHaveBeenCalledTimes(1);

  fireEvent.click(linkPath, { altKey: true });
  expect(onDelete).toHaveBeenCalledTimes(1);
  const dropdownAndDeleteButton = await screen.findAllByRole('button');
  dropdownAndDeleteButton[1].click();
  expect(onDelete).toHaveBeenCalledTimes(2);
});
