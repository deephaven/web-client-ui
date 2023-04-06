/* eslint-disable max-classes-per-file */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import usePanelRegistration from './usePanelRegistration';
import { PanelProps } from '../DashboardPlugin';

/* eslint-disable react/prefer-stateless-function */
class ClassCOMPONENT extends React.Component<PanelProps> {
  static COMPONENT = 'ClassCOMPONENT';
}
class ClassDisplayName extends React.Component<PanelProps> {
  static displayName = 'ClassDisplayName';
}
class ClassNoName extends React.Component<PanelProps> {}
/* eslint-enable react/prefer-stateless-function */

function FnCOMPONENT() {
  return null;
}
FnCOMPONENT.COMPONENT = 'FnCOMPONENT';
function FnDisplayName() {
  return null;
}
FnDisplayName.displayName = 'FnDisplayName';
function FnNoName() {
  return null;
}

const deregister = jest.fn();
const registerComponent = jest.fn();
const hydrate = jest.fn();
const dehydrate = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  registerComponent.mockReturnValue(deregister);
});

it.each([
  [ClassCOMPONENT.COMPONENT, ClassCOMPONENT],
  [ClassDisplayName.displayName, ClassDisplayName],
  [FnCOMPONENT.COMPONENT, FnCOMPONENT],
  [FnDisplayName.displayName, FnDisplayName],
])(
  'should register components with COMPONENT or displayName attributes and deregister on unmount: "%s"',
  (_label, ComponentType) => {
    const { unmount } = renderHook(() =>
      usePanelRegistration(registerComponent, ComponentType, hydrate, dehydrate)
    );

    const name =
      'COMPONENT' in ComponentType
        ? ComponentType.COMPONENT
        : ComponentType.displayName;

    expect(registerComponent).toHaveBeenCalledWith(
      name,
      ComponentType,
      hydrate,
      dehydrate
    );

    expect(deregister).not.toHaveBeenCalled();

    unmount();

    expect(deregister).toHaveBeenCalled();
  }
);

it.each([
  ['MockClassNoName', ClassNoName],
  ['MockFnNoName', FnNoName],
])(
  'should throw an error if no COMPONENT or displayName attribute exists: "%s"',
  (_label, ComponentType) => {
    const { result } = renderHook(() =>
      usePanelRegistration(registerComponent, ComponentType, hydrate, dehydrate)
    );

    expect(result.error).toEqual(
      new Error(
        'ComponentType must have a `COMPONENT` or `displayName` attribute.'
      )
    );
  }
);
