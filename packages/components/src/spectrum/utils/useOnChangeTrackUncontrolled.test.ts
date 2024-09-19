import { act, renderHook } from '@testing-library/react-hooks';
import { type ItemKey } from './itemUtils';
import {
  useOnChangeTrackUncontrolled,
  type UseOnChangeTrackUncontrolledOptions,
} from './useOnChangeTrackUncontrolled';

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  expect.hasAssertions();
});

describe('useOnChangeTrackUncontrolled', () => {
  const defaultSelectedKey = 'default.selectedKey';
  const changedKey = 'changed.key';
  const controlledKey = 'controlled.key';

  const props = {
    controlled: { selectedKey: controlledKey },
    controlledWithDefault: {
      defaultSelectedKey,
      selectedKey: controlledKey,
    },
    uncontrolled: {},
    uncontrolledWithDefault: { defaultSelectedKey },
  } satisfies Record<string, UseOnChangeTrackUncontrolledOptions<ItemKey>>;

  it.each([
    [props.uncontrolled, [undefined, changedKey]],
    [props.uncontrolledWithDefault, [defaultSelectedKey, changedKey]],
    [props.controlled, [controlledKey, controlledKey]],
    [props.controlledWithDefault, [controlledKey, controlledKey]],
  ] as const)(
    'should track controlled / uncontrolled state: %s, %s',
    (initialProps, [expectedInitial, expectedChanged]) => {
      const { result } = renderHook(() =>
        useOnChangeTrackUncontrolled(initialProps)
      );

      expect(result.current.selectedKeyMaybeUncontrolled).toEqual(
        expectedInitial
      );

      act(() => {
        result.current.onChangeMaybeUncontrolled(changedKey);
      });

      expect(result.current.selectedKeyMaybeUncontrolled).toEqual(
        expectedChanged
      );
    }
  );
});
