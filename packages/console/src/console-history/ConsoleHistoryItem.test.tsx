import { render } from '@testing-library/react';
import ConsoleHistoryItem from './ConsoleHistoryItem';

const DEFAULT_ITEM = {
  message: 'Test item',
  cancelResult: () => undefined,
  disabledObjects: [],
};

it('renders default item without crashing', () => {
  render(
    <ConsoleHistoryItem
      item={DEFAULT_ITEM}
      language="python"
      openObject={jest.fn()}
    />
  );
});
